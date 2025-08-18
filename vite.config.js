import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.js",
    },
  },
  server: {
    host: true,
    port: 5173,
    open: true,
  },
});
