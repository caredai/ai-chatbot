import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ErrorComponent } from "@/components/error-component";
import { NotFoundComponent } from "@/components/not-found-component";
import { createQueryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultNotFoundComponent: NotFoundComponent,
    defaultErrorComponent: ErrorComponent,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: true,
    wrapQueryClient: true,
  });

  return router;
}
