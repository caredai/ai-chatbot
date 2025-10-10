import { createFileRoute } from "@tanstack/react-router";
import { DELETE, POST } from "@/app/(chat)/api/chat/route";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: ({ request }) => {
        return POST(request);
      },
      DELETE: ({ request }) => {
        return DELETE(request);
      },
    },
  },
});
