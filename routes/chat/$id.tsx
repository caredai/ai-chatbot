import {
  createFileRoute,
  Link,
  notFound,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { MessageIcon } from "@/components/icons";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { auth } from "@/lib/auth";
import { getChatModelFromCookie } from "@/lib/cookie";
import {
  getChatByIdFromServer,
  getMessagesByChatIdFromServer,
} from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export const Route = createFileRoute("/chat/$id")({
  validateSearch: (search: Record<string, string> & SearchSchemaInput) => ({
    query: search.query,
  }),
  // Why not beforeLoad?
  // https://github.com/TanStack/router/issues/2139
  loader: async ({ params }) => {
    const id = params.id;
    const chat = await getChatByIdFromServer({ data: { id } });
    if (!chat) {
      throw notFound();
    }

    const session = await auth();
    if (!session) {
      throw redirect({ to: "/" });
    }

    if (chat.visibility === "private") {
      if (!session.user) {
        throw notFound();
      }

      if (session.user.id !== chat.userId) {
        throw notFound();
      }
    }

    const messagesFromDb = await getMessagesByChatIdFromServer({
      data: { id },
    });

    const uiMessages: any = convertToUIMessages(messagesFromDb);

    const chatModelFromCookie = await getChatModelFromCookie();

    return {
      session,
      chat,
      uiMessages,
      chatModelFromCookie,
    };
  },
  component: RouteComponent,
  notFoundComponent: NotFoundComponent,
});

function RouteComponent() {
  const { session, chat, uiMessages, chatModelFromCookie } =
    Route.useLoaderData();

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialLastContext={chat.lastContext ?? undefined}
          initialMessages={uiMessages}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        {/* Chat icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MessageIcon size={32} />
        </div>

        <h1 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          Chat Not Found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The chat you're looking for doesn't exist or you don't have permission
          to view it. It may have been deleted or the link might be incorrect.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            to="/chat"
          >
            Start New Chat
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-fit text-muted-foreground text-xs">
            <p>If you believe this is an error, please check:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-justify">
              <li>The chat ID in the URL is correct</li>
              <li>You have permission to access this chat</li>
              <li>The chat hasn't been deleted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
