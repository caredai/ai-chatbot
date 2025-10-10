import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import type { RollupLog } from "rollup";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
  return {
    envDir: ".",
    server: {
      port: 3003,
    },
    plugins: [
      ...(command === "build"
        ? [
            cloudflare({
              viteEnvironment: { name: "ssr" },
            }),
          ]
        : []),
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart({
        srcDirectory: ".",
      }),
      svgr(),
      viteReact(),
    ],
    build: {
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
