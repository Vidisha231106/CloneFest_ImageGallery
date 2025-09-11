import axios from 'axios';
import { supabase } from './supabaseClient'; // Adjust path if needed

// ====================================================================
// 1. AXIOS INSTANCE SETUP
// This is the core piece that adds the auth token to every request.
// ====================================================================
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Use an interceptor to add the Supabase auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient; // Exporting this can also be useful

// ====================================================================
// 2. API FUNCTIONS
// Centralize all your endpoint calls here.
// ====================================================================

// --- Image API ---
export const fetchImages = () => apiClient.get('/api/images');
export const updateImage = (id, updates) => apiClient.put(`/api/images/${id}`, updates);
export const deleteImage = (id) => apiClient.delete(`/api/images/${id}`);
export const uploadImages = (formData) => {
  return apiClient.post('/api/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// --- Album API ---
export const fetchAlbums = () => apiClient.get('/api/albums');
export const createAlbum = (name, description) => {
  return apiClient.post('/api/albums', { name, description });
};
export const fetchAlbumDetails = (albumId) => apiClient.get(`/api/albums/${albumId}`);
export const addImageToAlbum = (albumId, imageId) => {
  return apiClient.post(`/api/albums/${albumId}/images`, { imageId });
};
export const removeImageFromAlbum = (albumId, imageId) => {
  return apiClient.delete(`/api/albums/${albumId}/images/${imageId}`);
};

// --- AI Generation API ---
export const generateImage = (prompt) => apiClient.post('/api/generate', { prompt });

// --- Search API ---
export const searchTextVector = (query) => {
  return apiClient.post('/api/search/vector', { type: 'text', query });
};

// --- Palette API ---
export const fetchPalettes = () => apiClient.get('/api/palettes');
export const savePalette = (name, colors) => apiClient.post('/api/palettes', { name, colors });
