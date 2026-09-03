import { toast } from "react-hot-toast";

export const handleAuthError = (navigate, showToast = false) => {
  const hadToken = !!localStorage.getItem("token");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (showToast && hadToken) {
    toast.error("Session expired. Please login again.");
  }
  navigate("/login");
};

export const makeAuthenticatedRequest = async (url, options = {}, navigate) => {
  const token = localStorage.getItem("token");

  if (!token || !isTokenValid()) {
    handleAuthError(navigate, false);
    throw new Error("No valid authentication token found");
  }

  const defaultHeaders = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Don't redirect or toast here — let DashboardLayout handle auth
        throw new Error("Authentication failed");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "="))
    );

    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
