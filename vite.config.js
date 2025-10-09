// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import legacy from "@vitejs/plugin-legacy";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  publicDir: "public",
  root: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  plugins: [
    eslint({
      cache: false,
      fix: true,
    }),
    legacy({}),
    VitePWA({
      injectRegister: "inline",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        cleanupOutdatedCaches: false,
      },
      includeAssets: ["icons/*"],
      manifest: {
        name: "Serial Projector",
        short_name: "SerialProjector",
        description:
          "A simple web application that shows last line of text got from serial port with a big font.",
        categories: ["developer", "developer tools", "eductaion", "utilities"],
        theme_color: "#f6871f",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/home.png",
            sizes: "1920x1080",
            type: "image/png",
            label: "Home screen",
          },
          {
            src: "screenshots/home-wide.webp",
            sizes: "1280x720",
            type: "image/webp",
            form_factor: "wide",
            label: "Wide home screen",
          },
        ],
      },
    }),
  ],
});
