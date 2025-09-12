import React, { useState } from 'react';
import { User, Upload, Image, LogOut, BookImage, Palette } from 'lucide-react';
import ColorPaletteEditor from './ColorPaletteEditor';

function Header({ currentView, onPageChange, user, onLogout, theme, onThemeChange }) {
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);

  const navItems = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'uploader', label: 'Upload', icon: Upload },
    { id: 'albums', label: 'Albums', icon: BookImage },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header
      className="shadow-lg border-b backdrop-blur-md sticky top-0 z-50"
      style={{
        backgroundColor: `${theme.background}f0`,
        borderColor: `${theme.primary}20`,
        background: `linear-gradient(135deg, ${theme.background}f0, ${theme.primary}05)`,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`,
                boxShadow: `0 4px 20px ${theme.primary}30`,
              }}
            >
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: theme.text }}>
                ImageGallery
              </h1>
              <div className="h-0.5 w-8 rounded-full mt-1" style={{ backgroundColor: theme.accent }} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${currentView === id
                    ? 'text-white shadow-lg transform scale-105'
                    : 'hover:bg-opacity-10' // Use opacity for hover background
                  }`}
                style={
                  currentView === id
                    ? {
                      background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`,
                      boxShadow: `0 4px 15px ${theme.primary}40`,
                      color: 'white',
                    }
                    : {
                      color: theme.text,
                      // Set hover background color with opacity
                      '--hover-bg': `${theme.primary}1A` // Use a hex value for opacity
                    }
                }
                onMouseEnter={(e) => {
                  if (currentView !== id) e.currentTarget.style.backgroundColor = e.currentTarget.style.getPropertyValue('--hover-bg');
                }}
                onMouseLeave={(e) => {
                  if (currentView !== id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}

            {/* Theme Customizer Button */}
            <button
              onClick={() => setShowThemeCustomizer(!showThemeCustomizer)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{ color: theme.text, backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${theme.primary}10`;
                e.target.style.color = theme.primary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.text;
              }}
            >
              <Palette className="w-4 h-4" />
              <span>Theme Customizer</span>
            </button>
          </nav>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right" style={{ color: theme.text }}>
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                  style={{ background: `linear-gradient(45deg, ${theme.secondary}, ${theme.primary})` }}
                >
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
                  style={{ color: theme.text, backgroundColor: `${theme.primary}10` }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = `${theme.primary}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = `${theme.primary}10`;
                  }}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onPageChange('auth')}
                className="text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                style={{
                  background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`,
                  boxShadow: `0 4px 15px ${theme.primary}40`,
                }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <select
              value={currentView}
              onChange={(e) => onPageChange(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: `${theme.primary}30`, backgroundColor: theme.background, color: theme.text }}
            >
              {navItems.map(({ id, label }) => (
                <option key={id} value={id} style={{ backgroundColor: theme.background, color: theme.text }}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Theme Customizer Panel - positioned absolutely to appear above other components */}
      {showThemeCustomizer && (
        <ColorPaletteEditor
          theme={theme}
          onThemeChange={onThemeChange}
          floating={false}
          isOpen={showThemeCustomizer}
          onClose={() => setShowThemeCustomizer(false)}
        />
      )}
    </header>
  );
}

export default Header;