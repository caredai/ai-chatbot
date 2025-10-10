import { createFileRoute } from "@tanstack/react-router";
import type { NextRequest } from "next/server";
import { GET } from "@/app/(chat)/api/history/route";

export const Route = createFileRoute("/api/history")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        // @ts-expect-error
        request.nextUrl = {
          searchParams,
        };
        return GET(request as NextRequest);
      },
    },
  },
});
