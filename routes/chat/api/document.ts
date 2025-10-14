import { createFileRoute } from "@tanstack/react-router";
import { DELETE, GET, POST } from "@/app/(chat)/api/document/route";

export const Route = createFileRoute("/chat/api/document")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return GET(request);
      },
      POST: ({ request }) => {
        return POST(request);
      },
      DELETE: ({ request }) => {
        return DELETE(request);
      },
    },
  },
});
