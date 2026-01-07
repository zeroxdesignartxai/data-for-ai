import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    entry: "src/main/index.ts",
    resolve: {
      alias: {
        "@": resolve("src")
      }
    }
  },
  preload: {
    input: {
      index: "src/preload/index.ts"
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@": resolve("src")
      }
    },
    plugins: [react()]
  }
});
