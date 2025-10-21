import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    throw redirect({
      href: import.meta.env.VITE_CHAT_URL ?? "/",
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div />;
}
