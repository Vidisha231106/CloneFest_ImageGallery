import axios from 'axios';
import { supabase } from './supabaseClient'; // Adjust path if needed

// ====================================================================
// 1. AXIOS INSTANCE SETUP
// This is the core piece that adds the auth token to every request.
// ====================================================================
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://clonefestimagegallerybackend-production.up.railway.app/'
});
// Use an interceptor to add the Supabase auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
export const createAlbum = async (name, description = '') => {
  try {
    const response = await apiClient.post('/api/albums', { name, description });
    return response.data; // Return the actual data object
  } catch (error) {
    console.error("API Error creating album:", error);
    throw error; // Re-throw the error so the component can catch it
  }
};
export const fetchAlbumDetails = (albumId) => apiClient.get(`/api/albums/${albumId}`);
export const addImageToAlbum = async (albumId, imageId) => {
  try {
    const response = await apiClient.post(`/api/albums/${albumId}/images`, { imageId });
    return response.data;
  } catch (error) {
    // The backend sends a 409 if the image is already in the album
    if (error.response?.status === 409) {
      alert('This image is already in the selected album.');
    } else {
      console.error(`API Error adding image ${imageId} to album ${albumId}:`, error);
    }
    throw error;
  }
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

// Add this function to your api.js file, inside the "Album API" section

