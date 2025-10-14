import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import type { RollupLog } from "rollup";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    envDir: ".",
    server: {
      port: 3003,
    },
    define: {
      __dirname: JSON.stringify(""),
    },
    plugins: [
      cloudflare({
        viteEnvironment: { name: "ssr" },
      }),
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart({
        srcDirectory: ".",
        serverFns: {
          base: "/chat/_serverFn",
        },
      }),
      svgr(),
      viteReact(),
    ],
    build: {
      assetsDir: "chat/assets",
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        onwarn(
          warning: RollupLog,
          defaultHandler: (warn: string | RollupLog) => void
        ) {
          if (warning.code !== "INVALID_ANNOTATION") {
            defaultHandler(warning);
          }
        },
      },
    },
    ssr: {
      noExternal: ["streamdown", "react-syntax-highlighter"],
    },
    optimizeDeps: {
      include: ["streamdown", "react-syntax-highlighter"],
    },
  };
});
