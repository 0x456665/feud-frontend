// Base URL for the API. Frontend does not require a runtime env var unless
// you need to override the backend host in production.
// VITE_API_URL is optional and defaults to localhost:3000/api/v1.
export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
