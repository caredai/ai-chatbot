/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import globalsCss from "@/app/globals.css?url";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { ErrorComponent } from "@/components/error-component";
import { NotFoundComponent } from "@/components/not-found-component";
import { ThemeProvider } from "@/components/theme";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { getSidebarStateFromCookie } from "@/lib/cookie";

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Chat | Cared",
      },
    ],
    links: [{ rel: "stylesheet", href: globalsCss }],
    scripts: [
      {
        children: THEME_COLOR_SCRIPT,
      },
    ],
  }),
  scripts: () => [
    {
      src: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js",
    },
  ],
  beforeLoad: async () => {
    const session = await auth();
    const isCollapsed = (await getSidebarStateFromCookie()) !== "true";
    return {
      session,
      isCollapsed,
    };
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { session, isCollapsed } = Route.useRouteContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <DataStreamProvider>
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset>
                <Outlet />
              </SidebarInset>
            </SidebarProvider>
          </DataStreamProvider>
        </ThemeProvider>
        <Toaster position="top-center" />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
        <Scripts />
      </body>
    </html>
  );
}
