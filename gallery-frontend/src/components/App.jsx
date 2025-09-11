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
  const [images, setImages] = useState([
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop",
      title: "Mountain Lake Serenity",
      caption: "A peaceful mountain lake reflecting the sky at dawn",
      altText: "Serene mountain lake with perfect reflections",
      tags: ["nature", "landscape", "mountains", "water", "peaceful"]
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop",
      title: "Forest Path Adventure",
      caption: "Sunlight filtering through ancient trees on a woodland trail",
      altText: "Sunlit forest path through tall trees",
      tags: ["forest", "nature", "trees", "adventure", "sunlight"]
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&h=300&fit=crop",
      title: "Ocean Sunset Magic",
      caption: "Golden hour waves meeting a vibrant sunset horizon",
      altText: "Ocean waves during golden sunset",
      tags: ["ocean", "sunset", "waves", "golden-hour", "seascape"]
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500&h=300&fit=crop",
      title: "Desert Dunes Dream",
      caption: "Rolling sand dunes under a star-filled desert sky",
      altText: "Sand dunes in desert landscape",
      tags: ["desert", "dunes", "sand", "landscape", "vast"]
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=500&h=300&fit=crop",
      title: "City Lights Sparkle",
      caption: "Urban skyline illuminated against the twilight sky",
      altText: "City skyline with lights at night",
      tags: ["city", "urban", "lights", "skyline", "night"]
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
      title: "Autumn Leaves Dance",
      caption: "Colorful fall foliage covering a quiet countryside road",
      altText: "Autumn trees with colorful leaves",
      tags: ["autumn", "fall", "leaves", "colors", "seasonal"]
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1464822759844-d150b343c637?w=500&h=300&fit=crop",
      title: "Snowy Peak Majesty",
      caption: "Snow-capped mountain peaks piercing through morning clouds",
      altText: "Snow-covered mountain peaks above clouds",
      tags: ["mountains", "snow", "peaks", "clouds", "majestic"]
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&h=300&fit=crop",
      title: "Flower Field Bliss",
      caption: "Endless fields of wildflowers swaying in the gentle breeze",
      altText: "Colorful wildflower field in bloom",
      tags: ["flowers", "field", "wildflowers", "nature", "colorful"]
    }
  ]);

  // Default theme with improved colors
  const defaultTheme = {
    background: '#ffffff',
    text: '#1f2937',
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#10b981'
  };

  const [theme, setTheme] = useState(defaultTheme);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleLogin = (userData) => {
    setLoading(true);
    setTimeout(() => {
      setUser(userData);
      setCurrentView('gallery');
      setLoading(false);
    }, 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
