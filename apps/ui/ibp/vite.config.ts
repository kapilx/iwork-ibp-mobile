/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { VitePWA } from "vite-plugin-pwa";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

/**
 * Event loop status monitor — rewrites the same terminal line when TTY, silent otherwise.
 */
function eventLoopMonitor() {
  let totalFiles = 0;
  let lastActivity = Date.now();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const isTTY = Boolean(process.stdout.isTTY);

  const start = () => {
    if (!isTTY) return;
    intervalId = setInterval(() => {
      const idle = ((Date.now() - lastActivity) / 1000).toFixed(1);
      process.stdout.write(`\r\x1b[K💓 Event Loop | idle: ${idle}s | transforms: ${totalFiles}`);
    }, 3000);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      if (isTTY) process.stdout.write("\n");
    }
  };

  return {
    name: "event-loop-monitor",
    buildStart() { totalFiles = 0; lastActivity = Date.now(); start(); },
    transform(_: string, id: string) { if (!id.includes("node_modules")) { totalFiles++; lastActivity = Date.now(); } return null; },
    buildEnd() { stop(); },
    closeBundle() { stop(); },
  };
}

/**
 * Global error handlers (nothing escapes)
 */
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
});

const port = Number(process.env.VITE_PORT_IBP) || 4201;
const isMF = process.env.VITE_MF === "true";
// PWA (manifest + service worker) only ever applies to the standalone deployable
// build — never to the Module Federation remote, which is mounted inside another
// app's origin/scope and must not register its own service worker.
const isPWA = process.env.VITE_PWA === "true" && !isMF;

export default defineConfig({
  root: __dirname,
  base: isMF ? "/ibp/" : "/",
  cacheDir: "../../../node_modules/.vite/apps/ui/ibp",

  server: {
    port,
    host: "localhost",
    cors: true,
  },

  preview: {
    port: 4302,
    host: "localhost",
  },

  plugins: [
    eventLoopMonitor(),
    nxViteTsPaths(),
    react(),
    ...(isMF ? [
      federation({
        name: "ibp",
        filename: "remoteEntry.js",
        exposes: {
          "./App": path.join(__dirname, "src/remote-entry.ts"),
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: "^18.2.0",
            eager: true,
          },
          "react-dom": {
            singleton: true,
            requiredVersion: "^18.2.0",
            eager: true,
          },
          "@tanstack/react-query": {
            singleton: true,
            eager: false,
          },
        },
        runtimePlugins: [],
      })
    ] : []),
    ...(isPWA ? [
      VitePWA({
        registerType: "prompt",
        injectRegister: false, // registered manually from usePwaServiceWorker so we control the update-toast UX
        includeAssets: ["favicon.ico", "icons/apple-touch-icon.png"],
        manifest: {
          name: "IBP - Insurance Benefits Portal",
          short_name: "IBP",
          description: "Manage your group insurance policies, claims, e-card and documents.",
          theme_color: "#0A73E9",
          background_color: "#FFFFFF",
          display: "standalone",
          start_url: ".",
          scope: "/",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          // App-shell precaching only (Phase 1). Runtime caching of API data
          // for offline reads, and excluding the HR-Portal chunk from precache
          // once it is route-split, are addressed in later phases.
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          navigateFallback: "/index.html",
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: true,
        },
      })
    ] : []),
  ],

  build: {
    target: "esnext",
    rollupOptions: {
      onwarn(warning, warn) {
        console.warn("⚠️ Rollup Warning:", warning);
        warn(warning);
      },
      onLog(level, log, handler) {
        console.log("📋 Rollup [%s]:", level, JSON.stringify(log).substring(0, 200));
        handler(level, log);
      },
    },
    reportCompressedSize: false,
    minify: false,
    chunkSizeWarningLimit: 5000,
  },
});
