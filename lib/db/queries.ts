// import "server-only";

import { env } from "cloudflare:workers";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import ws from "ws";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { convertToUIMessages, generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

let cachedDb:
  | PostgresJsDatabase<Record<string, never>>
  | NeonDatabase<Record<string, never>>
  | undefined;
const getDb = createServerOnlyFn(async () => {
  if (
    cachedDb &&
    !env.HYPERDRIVE &&
    !globalThis.navigator.userAgent.includes("Cloudflare-Workers")
  ) {
    return cachedDb;
  }

  let db: typeof cachedDb;
  if (!db) {
    if (env.HYPERDRIVE) {
      const postgres = (await import("postgres")).default;
      const client = postgres(env.HYPERDRIVE.connectionString, {
        // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections
        max: 5,
        // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)
        fetch_types: false,
      });
      db = drizzle(client);
    } else if (process.env.POSTGRES_URL?.includes("neon.tech")) {
      const pool = new NeonPool({ connectionString: process.env.POSTGRES_URL });
      db = drizzleNeon(pool);
    } else {
      const postgres = (await import("postgres")).default;
      // biome-ignore lint: Forbidden non-null assertion.
      const client = postgres(process.env.POSTGRES_URL!);
      db = drizzle(client);
    }
  }

  if (
    !cachedDb &&
    !env.HYPERDRIVE &&
    !globalThis.navigator.userAgent.includes("Cloudflare-Workers")
  ) {
    cachedDb = db;
  }

  return db;
});

export async function getUser(email: string): Promise<User[]> {
  try {
    return await (await getDb())
      .select()
      .from(user)
      .where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await (await getDb())
      .insert(user)
      .values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await (await getDb())
      .insert(user)
      .values({ email, password })
      // @ts-expect-error
      .returning({
        id: user.id,
        email: user.email,
      });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await (await getDb()).insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export const deleteChatById = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }) => {
    const messages = await getMessagesByChatId({ id });
    const fileUrlsToDelete = convertToUIMessages(messages)
      .flatMap((m) => m.parts.map((p) => p.type === "file" && p.url))
      .filter(
        (url): url is string =>
          !!url && url.startsWith(import.meta.env.VITE_IMAGE_URL)
      );

    try {
      await (await getDb()).delete(vote).where(eq(vote.chatId, id));
      await (await getDb()).delete(message).where(eq(message.chatId, id));
      await (await getDb()).delete(stream).where(eq(stream.chatId, id));

      const [chatsDeleted] = await (await getDb())
        .delete(chat)
        .where(eq(chat.id, id))
        .returning();

      if (fileUrlsToDelete.length) {
        await env.R2.delete(
          fileUrlsToDelete.map((fileUrl) =>
            decodeURIComponent(new URL(fileUrl).pathname.slice(1))
          )
        );
      }

      return chatsDeleted;
    } catch (_error) {
      console.error(_error);
      throw new ChatSDKError(
        "bad_request:database",
        "Failed to delete chat by id"
      );
    }
  });

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = async (whereCondition?: SQL<any>) =>
      (await getDb())
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await (await getDb())
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await (await getDb())
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await (await getDb())
      .select()
      .from(chat)
      .where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export const getChatByIdFromServer = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(({ data: { id } }) => getChatById({ id }));

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await (await getDb()).insert(message).values(messages);
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await (await getDb())
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export const getMessagesByChatIdFromServer = createServerFn()
  .inputValidator((data: { id: string }) => data)
  // @ts-expect-error
  .handler<Promise<DBMessage[]>>(({ data: { id } }) =>
    getMessagesByChatId({ id })
  );

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await (await getDb())
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await (await getDb())
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await (await getDb()).insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await (await getDb()).select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await (await getDb())
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await (await getDb())
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await (await getDb())
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await (await getDb())
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await (await getDb())
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await (await getDb()).insert(suggestion).values(suggestions);
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await (await getDb())
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await (await getDb())
      .select()
      .from(message)
      .where(eq(message.id, id));
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await (await getDb())
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await (await getDb())
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await (await getDb())
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await (await getDb())
      .update(chat)
      .set({ visibility })
      .where(eq(chat.id, chatId));
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await (await getDb())
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await (await getDb())
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await (await getDb())
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await (await getDb())
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    console.error(_error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
