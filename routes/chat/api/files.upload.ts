import { createFileRoute } from "@tanstack/react-router";
import { POST } from "@/app/(chat)/api/files/upload/route";

export const Route = createFileRoute("/chat/api/files/upload")({
  server: {
    handlers: {
      POST: ({ request }) => {
        return POST(request);
      },
    },
  },
});
