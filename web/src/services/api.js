import axios from 'axios';
import { getToken } from './authStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchPublicTrack(bookingId, token) {
  const { data } = await api.get(`/public/track/${bookingId}/${token}`);
  return data.data;
}

export default api;
