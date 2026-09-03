// Use the deployed API as the production fallback; keep localhost for local dev.
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = import.meta.env.PROD
  ? "https://campus2career-cpe2.onrender.com"
  : "http://localhost:5000";

export const API_URL = (configuredApiUrl || defaultApiUrl).replace(/\/$/, "");
