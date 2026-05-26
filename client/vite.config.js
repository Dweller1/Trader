import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/ws": { target: "ws://localhost:5000", ws: true },
    },
  },
});
