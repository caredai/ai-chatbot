import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/files/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
