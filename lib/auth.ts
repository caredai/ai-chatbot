import { CaredClient } from "@cared/sdk";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Session } from "next-auth";

const isomorphicHeaders = createIsomorphicFn()
  .server(() => {
    const original = getRequestHeaders();
    const headers = new Headers();
    const cookie = original.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }
    headers.set("x-orpc-source", "cared-chatbot-server");
    return headers;
  })
  .client(() => {
    const headers = new Headers();
    headers.set("x-orpc-source", "cared-chatbot-client");
    return headers;
  });

const caredClient = new CaredClient({
  apiUrl: import.meta.env.VITE_API_URL || "https://api.cared.dev",
  headers: isomorphicHeaders,
});

export async function auth() {
  const session = await caredClient.orpcClient.user.session({
    auth: false,
  });
  if (!session) {
    return null;
  }
  return {
    user: {
      id: session.user.id,
      type: "regular",
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
    expires: session.session.expiresAt.toISOString(),
  } satisfies Session;
}
