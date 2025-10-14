import { isNotFound, isRedirect, redirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { sessionCookieName } from "@/lib/cared";

// TODO
// https://github.com/TanStack/router/issues/4460#issuecomment-3015836376
const convertRedirectErrorToExceptionMiddleware = createMiddleware().server(
  async ({ next }) => {
    const result = await next();
    if (
      "error" in result &&
      (isRedirect(result.error) || isNotFound(result.error))
    ) {
      throw result.error;
    }
    return result;
  }
);

const globalMiddleware = createMiddleware()
  .middleware([convertRedirectErrorToExceptionMiddleware])
  .server(({ next, request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname === "/" || pathname.startsWith("/chat")) {
      return next();
    }

    const sessionCookie = getCookie(sessionCookieName);
    if (!sessionCookie) {
      throw redirect({
        to: "/auth/sign-in",
        search: {
          redirectTo: "/chat",
        },
      });
    }

    return next();
  });

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [globalMiddleware],
  };
});
