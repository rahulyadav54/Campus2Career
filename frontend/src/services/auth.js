import { API_URL } from './api';

export const loginUser = async (credentials) => {
  let res;
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Unexpected server response. Please try again.');
  }

  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const handleApiError = (error) => {
  if (!error) return 'An unexpected error occurred';
  // fetch-based errors (our loginUser throws plain Error)
  if (error instanceof Error) return error.message;
  // axios-based errors
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'No response from server. Please check your connection.';
  return error.message || 'An unexpected error occurred';
};

export const refreshSession = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) return false;
    localStorage.setItem('token', data.token);
    return true;
  } catch {
    return false;
  }
};
