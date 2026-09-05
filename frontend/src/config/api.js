const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const fallback = import.meta.env.PROD
  ? 'https://campus2career-cpe2.onrender.com'
  : 'http://localhost:5000';

export const API_URL = configured || fallback;
