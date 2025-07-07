/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_PROD_API: string
  readonly VITE_API_BASE_URL_DEV: string
  readonly VITE_API_BASE_URL_PROD: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
