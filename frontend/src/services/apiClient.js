import { API_URL } from "../config/api";
import { refreshSession } from "./auth";

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getHeaders = (extra = {}, isFormData = false) => {
  const headers = {
    ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
    ...extra
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const request = async (method, path, body = null, { retries = MAX_RETRIES, timeout = DEFAULT_TIMEOUT } = {}) => {
  const url = `${API_URL}${path}`;
  const isFormData = body instanceof FormData;
  const options = { method };
  if (isFormData) {
    options.body = body;
  } else if (body) {
    options.body = JSON.stringify(body);
  }
  let refreshed = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { ...options, headers: getHeaders({}, isFormData) }, timeout);
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
      // Surface timeouts/aborts immediately instead of retrying (retrying a
      // timed-out request only makes the user wait longer).
      if (err.name === "AbortError") {
        const timeoutErr = new Error(`Request timed out (${timeout}ms)`);
        timeoutErr.status = 408;
        throw timeoutErr;
      }
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
  get: (path, config) => request("GET", path, null, config),
  post: (path, body, config) => request("POST", path, body, config),
  put: (path, body, config) => request("PUT", path, body, config),
  patch: (path, body, config) => request("PATCH", path, body, config),
  delete: (path, config) => request("DELETE", path, null, config)
};

export default apiClient;
