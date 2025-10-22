import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import EnvironmentPlugin from "vite-plugin-environment";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const isLocal = process.env.DFX_NETWORK === "local";
const proxyTarget = isLocal ? "http://127.0.0.1:4943" : "https://icp0.io";

export default defineConfig({
  plugins: [react(), EnvironmentPlugin("all", { prefix: "CANISTER_" }), EnvironmentPlugin("all", { prefix: "DFX_" })],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "@/core/components",
        replacement: fileURLToPath(new URL("./src/core/components", import.meta.url)),
      },
    ],
  },
});
