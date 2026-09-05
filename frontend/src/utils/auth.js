import { toast } from 'react-hot-toast';

export const handleAuthError = (navigate, showToast = false) => {
  const hadToken = !!localStorage.getItem('token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (showToast && hadToken) toast.error('Session expired. Please login again.');
  navigate('/login');
};

export const makeAuthenticatedRequest = async (url, options = {}, navigate) => {
  const token = localStorage.getItem('token');

  if (!token || !isTokenValid()) {
    handleAuthError(navigate, false);
    throw new Error('Authentication required');
  }

  const headers = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.');
  }

  if (response.status === 401 || response.status === 403) {
    handleAuthError(navigate, true);
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    let errorData = {};
    try { errorData = await response.json(); } catch { /* non-JSON body */ }
    throw new Error(errorData.message || `Request failed (${response.status})`);
  }

  return response;
};

export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      atob(base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '='))
    );
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
