/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config();
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

const portIWORK = process.env.VITE_PORT_IWORK || 5001;
const portIBP = process.env.VITE_PORT_IBP || 4201;

export default defineConfig({
  root: __dirname,
  cacheDir: "../../../node_modules/.vite/apps/ui/container",
  server: {
    port: 4200,
    fs: {
      allow: [path.resolve(__dirname, "../ui-lib")],
    },
    // host: "localhost",
  },
  preview: {
    port: 4300,
    host: "localhost",
  },
  plugins: [
    nxViteTsPaths(),
    react(),
    federation({
      name: "container",
      remotes: {
        iwork: {
          type: "module",
          name: "iwork",
          entry: `http://localhost:${portIWORK}/remoteEntry.js`,
        },
        ibp: {
          type: "module",
          name: "ibp",
          entry: `http://localhost:${portIBP}/remoteEntry.js`,
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.2.0",
        },
        "@tanstack/react-query": { singleton: true },
      },
    }),
  ],
  build: {
    // outDir: "dist",
    // emptyOutDir: true,
    target: "esnext",
    modulePreload: {
      polyfill: false, // 🚨 disables Vite's default preload behavior
    },
    // commonjsOptions: {
    //   transformMixedEsModules: true,
    // },
  },
});
