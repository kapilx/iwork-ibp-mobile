/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONFIG_SERVICE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PWA?: string;
  // Add more environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
