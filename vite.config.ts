import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const offline = mode === "offline";

  return {
    base: "./",
    plugins: [vue(), ...(offline ? [viteSingleFile()] : [])],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: offline
      ? {
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          outDir: "dist-offline",
        }
      : undefined,
    test: {
      environment: "node",
      include: ["src/**/*.spec.ts"],
    },
  };
});
