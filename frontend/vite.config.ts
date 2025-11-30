import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  envPrefix: "DigitalChess",
  plugins: [react()],
  preview: {
    host: true,
    strictPort: true,
    port: 8080,
  },
  server: {
    host: true,
    strictPort: true,
    port: 8080,
    watch: {
      usePolling: true,
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      icons: "/src/assets/icons",
      chessPieces: "/src/assets/chessPieces",
    },
  },
});
