import {
  createFileRoute,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { auth } from "@/lib/cared";
import { generateUUID } from "@/lib/utils";

export const Route = createFileRoute("/chat/")({
  validateSearch: (search: Record<string, string> & SearchSchemaInput) => ({
    query: search.query,
  }),
  beforeLoad: async () => {
    const session = await auth();
    if (!session) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirectTo: "/chat",
        },
      });
    }

    const id = generateUUID();

    return {
      id,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useRouteContext();

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
