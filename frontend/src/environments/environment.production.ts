/**
 * Production environment. By default the API is expected on the same origin
 * (reverse proxy `/api` → Django). Change to an absolute URL if the API runs
 * on a separate domain.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
