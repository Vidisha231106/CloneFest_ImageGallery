import React from 'react';
import { User, Upload, Image, LogOut, BookImage } from 'lucide-react';
import ColorPaletteEditor from './ColorPaletteEditor';

function Header({ currentView, onPageChange, user, onLogout, theme, onThemeChange }) {
  const navItems = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'uploader', label: 'Upload', icon: Upload },
    { id: 'albums', label: 'Albums', icon: BookImage },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header
      className="shadow-lg border-b backdrop-blur-md"
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
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === id ? 'text-white shadow-lg transform scale-105' : 'hover:scale-105'
                }`}
                style={
                  currentView === id
                    ? {
                        background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`,
                        boxShadow: `0 4px 15px ${theme.primary}40`,
                        color: 'white',
                      }
                    : { color: theme.text, backgroundColor: 'transparent' }
                }
                onMouseEnter={(e) => {
                  if (currentView !== id) {
                    e.target.style.backgroundColor = `${theme.primary}10`;
                    e.target.style.color = theme.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== id) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = theme.text;
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right side - Color Palette Editor + User Info */}
          <div className="flex items-center space-x-4">
            {/* Color Palette Editor */}
            <ColorPaletteEditor 
              theme={theme} 
              onThemeChange={onThemeChange} 
              floating={false}
              headerMode={true}
            />
            
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
                  className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
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
    </header>
  );
}

export default Header;