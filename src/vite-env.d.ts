/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string; // lägg fler VITE_* här vid behov
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}