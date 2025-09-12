import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Header from './Header';
import Gallery from './Gallery';
import ColorPaletteEditor from './ColorPaletteEditor';
import AIImageGenerator from './AIImageGenerator';
import VectorSearch from './VectorSearch';
import Uploader from './Uploader';
import UserAuth from './UserAuth';
import AlbumManager from './AlbumManager';

function App() {
  const [currentView, setCurrentView] = useState('gallery');
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

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
      if (token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
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
        const token = localStorage.getItem('authToken');
        try {
          const response = await fetch('/api/images', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setImages(data.images || []);
          }
        } catch (error) {
          console.error("Failed to fetch images:", error);
        }
      }
    };
    fetchImages();
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
    if (data.token && data.user) {
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      setCurrentView('gallery');
    } else if (data.user) { // For registration
        alert(data.message || 'Registration successful! Please log in.');
        // Don't log the user in automatically after registration
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setImages([]); // Clear images on logout
    setCurrentView('gallery');
  };

  const handleImagesGenerated = (newImages) => {
    if (Array.isArray(newImages)) {
      setImages(prev => [...newImages, ...prev]);
    }
  };

  const handleImagesUploaded = (newImages) => {
    if (Array.isArray(newImages)) {
      setImages(prev => [...newImages, ...prev]);
      setCurrentView('gallery'); // Switch to gallery after upload
    }
  };

  const handleThemeChange = (newTheme) => {
    if (newTheme && typeof newTheme === 'object') {
      setTheme(prevTheme => ({
        ...prevTheme,
        ...newTheme
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.background }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}></div>
          <p style={{ color: theme.text }}>Loading...</p>
        </div>
      </div>
    );
  }

  // 🔥 FIXED HERE
  if (!user) {
    return <UserAuth onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.background, color: theme.text }}>

      {/* Header */}
      <Header
        user={user}
        currentView={currentView}
        onPageChange={setCurrentView}
        onLogout={handleLogout}
        theme={theme}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'gallery' && (
          <Gallery images={images} theme={theme} />
        )}

        {currentView === 'uploader' && (
          <Uploader
            onImagesUploaded={handleImagesUploaded}
            theme={theme}
          />
        )}

        {currentView === 'albums' && (
          <AlbumManager theme={theme} />
        )}

        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Section */}
            <div className="rounded-lg shadow-lg border transition-all duration-300 hover:shadow-xl"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.secondary + '30'
              }}>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: theme.primary }}>
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
                      {user.username || 'User'}
                    </h2>
                    <p style={{ color: theme.secondary }}>
                      {user.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: theme.secondary + '20',
                      borderColor: theme.secondary + '30'
                    }}>
                    <div className="text-2xl font-bold" style={{ color: theme.primary }}>
                      {images.length}
                    </div>
                    <div className="text-sm" style={{ color: theme.secondary }}>
                      Total Images
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: theme.secondary + '20',
                      borderColor: theme.secondary + '30'
                    }}>
                    <div className="text-2xl font-bold" style={{ color: theme.accent }}>
                      {images.filter(img => img.tags?.includes('ai-generated')).length}
                    </div>
                    <div className="text-sm" style={{ color: theme.secondary }}>
                      AI Generated
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: theme.secondary + '20',
                      borderColor: theme.secondary + '30'
                    }}>
                    <div className="text-2xl font-bold" style={{ color: theme.primary }}>
                      {new Set(images.flatMap(img => img.tags || [])).size}
                    </div>
                    <div className="text-sm" style={{ color: theme.secondary }}>
                      Unique Tags
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Image Generator */}
            <AIImageGenerator
              onImagesGenerated={handleImagesGenerated}
              theme={theme}
            />

            {/* Advanced Search */}
            <VectorSearch
              images={images}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* Floating Theme Editor */}
      <ColorPaletteEditor
        theme={theme}
        onThemeChange={handleThemeChange}
        floating={true}
      />
    </div>
  );
}

export default App;
