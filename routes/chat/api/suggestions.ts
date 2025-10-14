import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/(chat)/api/suggestions/route";

export const Route = createFileRoute("/chat/api/suggestions")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return GET(request);
      },
    },
  },
});
