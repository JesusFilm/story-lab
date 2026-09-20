import { defineConfig } from "vite";

// Authoring-only bridge. Portable readers use embedded media, never this service.
export default defineConfig({
  server: {
    proxy: {
      "/api/kokoro": {
        target: "http://127.0.0.1:8770",
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api\/kokoro/, "/api"),
      },
    },
  },
});
