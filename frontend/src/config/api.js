const PRODUCTION_API = "https://campus2career-cpe2.onrender.com";
const DEAD_API_URLS = new Set([
  "https://campus2career-api.onrender.com",
]);

const configured = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);
const unusable =
  !configured ||
  DEAD_API_URLS.has(configured) ||
  (import.meta.env.PROD && isLocalhost);
const fallback = import.meta.env.PROD ? PRODUCTION_API : "http://localhost:5000";

export const API_URL = unusable ? fallback : configured;
