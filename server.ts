import handler from "@tanstack/react-start/server-entry";

export type RequestContext = {
  ctx?: ExecutionContext;
};

declare module "@tanstack/react-start" {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Needs to be interface
  interface Register {
    server: {
      requestContext: RequestContext;
    };
  }
}

export default {
  async fetch(request: Request, _env?: CloudflareEnv, ctx?: ExecutionContext) {
    return await handler.fetch(request, {
      context: {
        ctx,
      },
    });
  },
};
