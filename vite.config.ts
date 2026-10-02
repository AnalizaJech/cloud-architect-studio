import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/cloud-architect-studio/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Cloud Architect Studio",
        short_name: "Cloud Studio",
        description: "Editor de diagramas cloud sin conexión",
        start_url: "/cloud-architect-studio/",
        scope: "/cloud-architect-studio/",
        display: "standalone",
        background_color: "#0d1116",
        theme_color: "#0d1116",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/cloud-architect-studio/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/icons/icon-192.png", "**/icons/icon-512.png"],
      },
    }),
  ],
});
