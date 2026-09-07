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
          // App-shell precaching only (Phase 1): JS/CSS/HTML plus the small
          // manifest icons. Deliberately NOT "**/*.png"/"**/*.svg" — this repo
          // ships many multi-hundred-KB-to-multi-MB marketing/illustration
          // images (Life Events cards, wellness banners, login backgrounds,
          // etc.) that are page content, not app shell; precaching all of them
          // on install would be slow on mobile and isn't what "installable
          // app shell" is meant to cover. Runtime caching of API data and of
          // these content images for offline reads is addressed in a later
          // phase (see §2.10 of the PWA plan).
          globPatterns: ["**/*.{js,css,html}", "icons/*.png", "favicon.ico"],
          // globPatterns above already excludes it, but be explicit: the PDF.js
          // worker (~1.2MB) is only needed when a document is actually opened.
          globIgnores: ["**/pdf.worker*"],
          // No manualChunks (see rollupOptions.output comment above) means
          // everything lands in one main chunk — minification brings that
          // from ~19.4MB down to ~9MB, comfortably under this with headroom
          // for growth before this needs revisiting.
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
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
    // The Nx build executor overrides this via its own `outputPath` option
    // (apps/ui/ibp/package.json), so `nx build ibp` already wrote here
    // correctly. This explicit value matters for anything that invokes Vite
    // directly rather than through that executor — `vite preview` (used by
    // the `preview` Nx target, itself a plain `vite preview` run-commands
    // wrapper, not the Nx vite executor) otherwise falls back to Vite's
    // default "dist" relative to this app's own folder, which is never where
    // the real output goes, and fails with "directory dist does not exist".
    outDir: "../../../dist/apps/ui/ibp",
    // outDir sits outside this project's root, so Vite normally refuses to
    // empty it first (a safety default) — which is exactly how stale chunks
    // from a previous build were still sitting in dist and getting picked up
    // by Workbox's precache glob alongside the new ones. Force a clean output
    // on every build instead of relying on the caller to clear dist first.
    emptyOutDir: true,
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
      output: {
        // No manualChunks here — deliberately. apps/ui/ui-lib's redux and
        // utils modules have a genuine circular import between each other
        // (redux/slice.ts imports axiosInstance from utils/index.tsx, which
        // imports `store` back from redux/index.ts) that has always existed
        // in this codebase. It "worked" only because Rollup's single-chunk
        // output hoists/restructures around exactly this kind of cycle;
        // native ES module loading across separate chunk files does not get
        // that same treatment, so ANY manualChunks split — tried both a
        // grouped-by-library version and a version limited to four libraries
        // nowhere near the cycle — reproduced a real "Cannot access
        // userReducer before initialization" runtime error (verified with a
        // headless-browser repro, not just theorized). Fixing that properly
        // means breaking the redux/utils cycle at the source level, which is
        // a separate, deliberate change or should be flagged as a follow-up,
        // not something to do as a side effect of a build-config fix.
        // Minification alone (build.minify above) already took the bundle
        // from ~19.4MB to ~9MB single chunk — see the raised
        // workbox.maximumFileSizeToCacheInBytes below for the corresponding
        // safety-net size.
      },
    },
    reportCompressedSize: false,
    // Was unconditionally `false` — the single biggest contributor to the
    // ~19MB chunk that broke the Workbox precache step (see
    // workbox.maximumFileSizeToCacheInBytes above). Scoped to leave the
    // Module Federation remote build's existing (unminified) behavior alone,
    // since that path isn't part of the PWA build and wasn't broken.
    // Was unconditionally `false` — a large contributor to the ~19MB chunk
    // that broke the Workbox precache step (see maximumFileSizeToCacheInBytes
    // above). Scoped to leave the Module Federation remote build's existing
    // (unminified) behavior alone, since that path isn't part of the PWA
    // build and wasn't broken.
    minify: isMF ? false : true,
    chunkSizeWarningLimit: 5000,
  },
});
