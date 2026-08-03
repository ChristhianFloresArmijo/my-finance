export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Vue DDD Template',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },
  backend: {
    type: import.meta.env.VITE_BACKEND_TYPE || 'nestjs',
  },
  features: {
    enableMockAPI: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  },
} as const;
