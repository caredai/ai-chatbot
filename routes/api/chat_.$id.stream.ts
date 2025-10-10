import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/(chat)/api/chat/[id]/stream/route";

export const Route = createFileRoute("/api/chat_/$id/stream")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const { id } = params;
        return GET(request, {
          params: new Promise((resolve) => resolve({ id })),
        });
      },
    },
  },
});
