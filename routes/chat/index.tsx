import {
  createFileRoute,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { auth } from "@/lib/auth";
import { getChatModelFromCookie } from "@/lib/cookie";
import { generateUUID } from "@/lib/utils";

export const Route = createFileRoute("/chat/")({
  validateSearch: (search: Record<string, string> & SearchSchemaInput) => ({
    query: search.query,
  }),
  beforeLoad: async () => {
    const session = await auth();
    if (!session) {
      throw redirect({ to: "/" });
    }

    const id = generateUUID();

    const modelIdFromCookie = await getChatModelFromCookie();

    return {
      id,
      modelIdFromCookie,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, modelIdFromCookie } = Route.useRouteContext();

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
