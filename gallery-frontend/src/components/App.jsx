import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import apiClient from '../api'; // Import the configured API client
import Header from './Header';
import Gallery from './Gallery';
import AIImageGenerator from './AIImageGenerator';
import VectorSearch from './VectorSearch';
import Uploader from './Uploader';
import UserAuth from './UserAuth';
import AlbumManager from './AlbumManager';
import ConfirmationModal from './ConfirmationModal';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';

function App() {
  const [currentView, setCurrentView] = useState('gallery');
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  // Helper function to show confirmation dialog
  const showConfirmation = (title, message, onConfirm, type = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'danger'
    });
  };

  // Default theme with improved colors
  const defaultTheme = {
    background: '#ffffff',
    text: '#1f2937',
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#10b981'
  };
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const tokenExpiry = localStorage.getItem('tokenExpiry');

      if (token) {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const expiryTime = parseInt(tokenExpiry);

          let currentToken = token;

          // If token is expired or about to expire, try to refresh
          if (expiryTime && currentTime >= expiryTime - 300) { // 5 minutes before expiry
            if (refreshToken) {
              try {
                const refreshResponse = await apiClient.post('/api/users/refresh', {
                  refresh_token: refreshToken
                });

                const refreshData = refreshResponse.data;
                currentToken = refreshData.token;
                localStorage.setItem('authToken', refreshData.token);
                localStorage.setItem('refreshToken', refreshData.session.refresh_token);
                localStorage.setItem('tokenExpiry', refreshData.session.expires_at);
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('tokenExpiry');
                setUser(null);
                setLoading(false);
                return;
              }
            }
          }

          const response = await apiClient.get('/api/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiry');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      if (user) {
        setImagesLoading(true);
        try {
          const response = await apiClient.get('/api/images?limit=50');
          setImages(response.data.images || []);
        } catch (error) {
          console.error("Failed to fetch images:", error);
          showError('Load Failed', 'Failed to load images. Please refresh the page.');
        } finally {
          setImagesLoading(false);
        }
      }
    };
    fetchImages();

    // Set up realtime subscription for images
    let subscription = null;
    if (user) {
      subscription = supabase
        .channel('images_channel')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'images',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              // Add new image to the beginning
              setImages(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted image
              setImages(prev => prev.filter(img => img.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              // Update existing image
              setImages(prev => prev.map(img => 
                img.id === payload.new.id ? { ...img, ...payload.new } : img
              ));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--bg-color', theme.background);
        document.documentElement.style.setProperty('--text-color', theme.text);
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--accent-color', theme.accent);

        document.body.style.backgroundColor = theme.background;
        document.body.style.color = theme.text;
      }
    } catch (error) {
      console.warn('Theme application error:', error);
    }
  }, [theme]);

  const handleLogin = (data) => {
    if (data.token && data.user && data.session) {
      // Store both token and session data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.session.refresh_token);
      localStorage.setItem('tokenExpiry', data.session.expires_at);
      setUser(data.user);
      setCurrentView('gallery');
    } else if (data.user) {
      alert(data.message || 'Registration successful! Please log in.');
    }
  };

  const handleLogout = async () => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    setImages([]);
    setCurrentView('gallery');
  };

  // Image delete function
  const handleImageDelete = async (imageId) => {
    const actualDelete = async () => {
      try {
        // Optimistic update - remove immediately from UI
        const originalImages = images;
        setImages((prevImages) => prevImages.filter(img => img.id !== imageId));
        
        await apiClient.delete(`/api/images/${imageId}`);
        showSuccess('Image Deleted', 'The image has been successfully deleted.');
      } catch (error) {
        console.error('Delete error:', error);
        
        // Revert optimistic update on error
        setImages(originalImages);
        
        let errorMessage = 'Failed to delete the image. Please try again.';
        
        if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this image. You can only delete images that you uploaded.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Image not found. It may have already been deleted.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        showError('Delete Failed', errorMessage);
      }
    };

    // Show confirmation dialog
    showConfirmation(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      actualDelete,
      'danger'
    );
  };

  // Image update function with support for edited image uploads
  const handleImageUpdate = async (imageId, updates) => {
    const token = localStorage.getItem('authToken');
    try {
      let updatedData = { ...updates };

      if (updates.editedUrl && updates.editedUrl.startsWith('blob:')) {
        // Download edited blob from blob URL
        const response = await fetch(updates.editedUrl);
        const blob = await response.blob();

        // Upload blob to Supabase storage (or your backend)
        const { data, error } = await supabase.storage.from('edited-images').upload(`edited_${imageId}.png`, blob, {
          cacheControl: '3600',
          upsert: true
        });

        if (error) {
          throw new Error(error.message);
        }

        // Get public URL to store in image info
        const { publicURL, error: urlError } = supabase.storage.from('edited-images').getPublicUrl(data.path);
        if (urlError) {
          throw new Error(urlError.message);
        }

        updatedData.editedUrl = publicURL;
      }

      const response = await apiClient.put(`/api/images/${imageId}`, updatedData);
      const updatedImage = response.data;

      // Update local state
      setImages((prev) => prev.map(img => (img.id === imageId ? updatedImage : img)));
      showSuccess('Image Updated', 'The image has been successfully updated.');
    } catch (error) {
      console.error('Update error:', error);
      showError('Update Failed', error.response?.data?.error || 'Failed to update the image. Please try again.');
    }
  };

  const handleImagesGenerated = (newImages) => {
    if (Array.isArray(newImages)) {
      setImages((prev) => [...newImages, ...prev]);
    }
  };

  const handleImagesUploaded = (newImages) => {
    if (Array.isArray(newImages)) {
      setImages((prev) => [...newImages, ...prev]);
      setCurrentView('gallery');
    }
  };

  const handleThemeChange = (newTheme) => {
    if (newTheme && typeof newTheme === 'object') {
      setTheme((prevTheme) => ({
        ...prevTheme,
        ...newTheme
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
          />
          <p style={{ color: theme.text }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <UserAuth onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Header with integrated theme customizer */}
      <Header 
        user={user} 
        currentView={currentView} 
        onPageChange={setCurrentView} 
        onLogout={handleLogout} 
        theme={theme} 
        onThemeChange={handleThemeChange}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-16">
        {currentView === 'gallery' && (
          <Gallery 
            images={images} 
            theme={theme} 
            currentUser={user} 
            onImageUpdate={handleImageUpdate} 
            onImageDelete={handleImageDelete}
            loading={imagesLoading}
          />
        )}
        {currentView === 'uploader' && <Uploader onImagesUploaded={handleImagesUploaded} theme={theme} />}
        {currentView === 'albums' && <AlbumManager theme={theme} />}
        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile */}
            <div className="rounded-lg shadow-lg border transition-all duration-300 hover:shadow-xl" style={{ backgroundColor: theme.background, borderColor: theme.secondary + '30' }}>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg" style={{ backgroundColor: theme.primary }}>
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.text }}>{user.username || 'User'}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md" style={{ backgroundColor: theme.secondary + '20', borderColor: theme.secondary + '30' }}>
                    <div className="text-2xl font-bold" style={{ color: theme.primary }}>{images.length}</div>
                    <div className="text-sm" style={{ color: theme.secondary }}>Total Images</div>
                  </div>
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md" style={{ backgroundColor: theme.secondary + '20', borderColor: theme.secondary + '30' }}>
                    <div className="text-2xl font-bold" style={{ color: theme.accent }}>{images.filter(img => img.tags?.includes('ai-generated')).length}</div>
                    <div className="text-sm" style={{ color: theme.secondary }}>AI Generated</div>
                  </div>
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md" style={{ backgroundColor: theme.secondary + '20', borderColor: theme.secondary + '30' }}>
                    <div className="text-2xl font-bold" style={{ color: theme.primary }}>{new Set(images.flatMap(img => img.tags || [])).size}</div>
                    <div className="text-sm" style={{ color: theme.secondary }}>Unique Tags</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Image Generator */}
            <AIImageGenerator onImagesGenerated={handleImagesGenerated} theme={theme} />

            {/* Advanced Search */}
            <VectorSearch images={images} theme={theme} />
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        theme={theme}
      />
    </div>
  );
}

export default App;