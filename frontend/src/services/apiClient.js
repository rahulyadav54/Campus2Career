import { API_URL } from "../config/api";
import { refreshSession } from "./auth";

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
  ...extra
});

const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const request = async (method, path, body = null, retries = MAX_RETRIES) => {
  const url = `${API_URL}${path}`;
  const options = { method };
  if (body) options.body = JSON.stringify(body);
  let refreshed = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { ...options, headers: getHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && !refreshed && path !== "/api/auth/refresh") {
        refreshed = await refreshSession();
        if (refreshed) continue;
      }
      if (!res.ok) {
        const err = new Error(data.message || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (err) {
      const isRetryable = !err.status || err.status >= 500;
      if (attempt < retries && isRetryable) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
};

export const apiClient = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path)
};

export default apiClient;
