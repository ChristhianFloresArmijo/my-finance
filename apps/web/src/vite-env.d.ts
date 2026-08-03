/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BACKEND_TYPE: string;
  readonly VITE_ENABLE_MOCK_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
