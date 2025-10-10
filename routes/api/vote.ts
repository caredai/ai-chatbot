import { createFileRoute } from "@tanstack/react-router";
import { GET, PATCH } from "@/app/(chat)/api/vote/route";

export const Route = createFileRoute("/api/vote")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return GET(request);
      },
      PATCH: ({ request }) => {
        return PATCH(request);
      },
    },
  },
});
