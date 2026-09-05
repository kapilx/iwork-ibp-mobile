/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const port = Number(process.env.VITE_PORT_IWORK) || 5001;
const isMF = process.env.VITE_MF === "true";

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

export default defineConfig({
  root: __dirname,
  base: isMF ? "/iwork/" : "/",
  cacheDir: "../../../node_modules/.vite/apps/ui/iwork",

  server: {
    port,
    host: "localhost",
    cors: true,
  },

  preview: {
    port: 4301,
    host: "localhost",
  },

  plugins: [
    eventLoopMonitor(),
    nxViteTsPaths(),
    react(),
    ...(isMF ? [
      federation({
        name: "iwork",
        filename: "remoteEntry.js",
        exposes: {
          "./App": path.join(__dirname, "src/remote-entry.ts"),
        },
        shared: {
          react: { 
            singleton: true, 
            requiredVersion: "^18.2.0",
            eager: true, // ⚡ Prevent async loading deadlock
          },
          "react-dom": {
            singleton: true,
            requiredVersion: "^18.2.0",
            eager: true, // ⚡ Prevent async loading deadlock
          },
          "@tanstack/react-query": { 
            singleton: true,
            eager: false, // Allow async for non-critical
          },
        },
        runtimePlugins: [], // Explicitly empty to avoid runtime issues
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
    chunkSizeWarningLimit: 5000, // Increase to avoid warnings
  },
});