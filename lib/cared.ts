import { CaredClient } from "@cared/sdk";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeaders } from "@tanstack/react-start/server";
import type { Session } from "next-auth";
import { lruCache } from "@/lib/cache";

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

export const caredClient = new CaredClient({
  apiUrl: import.meta.env.VITE_API_URL || "https://api.cared.dev",
  headers: isomorphicHeaders,
});

export const orpc = caredClient.orpc;

export async function auth() {
  const cacheKey = isomorphicSessionCacheKey();
  if (!cacheKey) {
    return null;
  }
  const cachedSession = lruCache.get(cacheKey);
  if (cachedSession) {
    return cachedSession as Session;
  }

  const sess = await caredClient.orpcClient.user.session({
    auth: false,
  });
  if (!sess) {
    return null;
  }
  const ttl = Number(sess.session.expiresAt) - Date.now() - 100; // - jitter
  if (ttl <= 0) {
    return null;
  }

  const session = {
    user: {
      id: sess.user.id,
      type: "regular",
      name: sess.user.name,
      email: sess.user.email,
      image: sess.user.image ?? null,
    },
    expires: sess.session.expiresAt.toISOString(),
  } satisfies Session;

  lruCache.set(cacheKey, session, {
    ttl,
  });

  return session;
}

const cookiePrefix = import.meta.env.VITE_CHAT_URL?.startsWith("https")
  ? "__Secure-"
  : "";
export const sessionCookieName = `${cookiePrefix}cared.session_token`;

const isomorphicSessionCacheKey = createIsomorphicFn()
  .server(() => {
    const sessionCookie = getCookie(sessionCookieName);
    if (!sessionCookie) {
      return;
    }
    // Just use session cookie as cache key
    return `session:${sessionCookie}`;
  })
  .client(() => "session");
