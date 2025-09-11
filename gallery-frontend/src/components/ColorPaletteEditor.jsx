import React, { useState, useEffect } from 'react';
import { Palette, X, Sparkles, Moon, Sun, Paintbrush } from 'lucide-react';

function ColorPaletteEditor({ theme, onThemeChange, floating = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');

  // Predefined theme presets
  const themePresets = [
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#2563EB',
        secondary: '#475569',
        accent: '#0EA5E9',
        background: '#F8FAFC',
        text: '#1E293B'
      }
    },
    {
      name: 'Forest Green',
      colors: {
        primary: '#059669',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#F0FDF4',
        text: '#064E3B'
      }
    },
    {
      name: 'Sunset Orange',
      colors: {
        primary: '#EA580C',
        secondary: '#78716C',
        accent: '#F59E0B',
        background: '#FFFBEB',
        text: '#9A3412'
      }
    },
    {
      name: 'Royal Purple',
      colors: {
        primary: '#7C3AED',
        secondary: '#6B7280',
        accent: '#A855F7',
        background: '#FAF5FF',
        text: '#581C87'
      }
    },
    {
      name: 'Rose Pink',
      colors: {
        primary: '#E11D48',
        secondary: '#6B7280',
        accent: '#F43F5E',
        background: '#FFF1F2',
        text: '#881337'
      }
    },
    {
      name: 'Dark Mode',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#111827',
        text: '#F9FAFB'
      }
    },
    {
      name: 'Midnight',
      colors: {
        primary: '#8B5CF6',
        secondary: '#6B7280',
        accent: '#06B6D4',
        background: '#0F172A',
        text: '#E2E8F0'
      }
    },
    {
      name: 'Warm Sand',
      colors: {
        primary: '#D97706',
        secondary: '#78716C',
        accent: '#F59E0B',
        background: '#FEF7ED',
        text: '#92400E'
      }
    }
  ];

  const colorOptions = [
    { key: 'primary', label: 'Primary', description: 'Main brand color' },
    { key: 'secondary', label: 'Secondary', description: 'Supporting color' },
    { key: 'accent', label: 'Accent', description: 'Highlight color' },
    { key: 'background', label: 'Background', description: 'Page background' },
    { key: 'text', label: 'Text', description: 'Main text color' }
  ];

  const handlePresetSelect = (preset) => {
    onThemeChange(preset.colors);
  };

  const handleColorChange = (key, value) => {
    onThemeChange({ ...theme, [key]: value });
  };

  const resetToDefault = () => {
    const defaultTheme = {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#1F2937'
    };
    onThemeChange(defaultTheme);
  };

  if (!floating) {
    // Original inline component for profile page
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Palette className="w-6 h-6" style={{ color: theme.primary }} />
            <h3 className="text-xl font-semibold" style={{ color: theme.text }}>Theme Customizer</h3>
          </div>
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="space-y-4">
          {colorOptions.map(({ key, label, description }) => (
            <div key={key} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium" style={{ color: theme.text }}>{label}</h4>
                <p className="text-sm text-gray-600">{description}</p>
                <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {theme[key]}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chrome-style floating theme customizer
  return (
    <>
      {/* Floating Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
        style={{
          background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`,
          boxShadow: `0 8px 32px ${theme.primary}40`
        }}
      >
        <Palette className="w-6 h-6 text-white" />
      </button>

      {/* Theme Customizer Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div 
            className="fixed bottom-24 right-6 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{
              background: theme.background,
              border: `1px solid ${theme.primary}20`
            }}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 border-b"
              style={{ 
                borderColor: `${theme.primary}20`,
                background: `linear-gradient(135deg, ${theme.background}, ${theme.primary}05)`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <Palette className="w-5 h-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: theme.text }}>
                      Customize Theme
                    </h3>
                    <p className="text-sm text-gray-500">Choose your perfect colors</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: theme.text }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mt-4 p-1 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'presets' 
                      ? 'text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={activeTab === 'presets' ? { backgroundColor: theme.primary } : {}}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'custom' 
                      ? 'text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={activeTab === 'custom' ? { backgroundColor: theme.primary } : {}}
                >
                  <Paintbrush className="w-4 h-4 inline mr-2" />
                  Custom
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'presets' ? (
                <div className="grid grid-cols-2 gap-3">
                  {themePresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetSelect(preset)}
                      className="group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: JSON.stringify(preset.colors) === JSON.stringify(theme) 
                          ? theme.primary 
                          : 'transparent',
                        backgroundColor: preset.colors.background
                      }}
                    >
                      <div className="flex space-x-1 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                      </div>
                      <p 
                        className="text-xs font-medium truncate"
                        style={{ color: preset.colors.text }}
                      >
                        {preset.name}
                      </p>
                      
                      {/* Selection indicator */}
                      {JSON.stringify(preset.colors) === JSON.stringify(theme) && (
                        <div 
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {colorOptions.map(({ key, label, description }) => (
                    <div key={key} className="space-y-2">
                      <label className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: theme.text }}>
                          {label}
                        </span>
                        <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>
                          {theme[key]}
                        </code>
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={theme[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2"
                          style={{ borderColor: `${theme.primary}30` }}
                        />
                        <div className="flex-1">
                          <div 
                            className="w-full h-8 rounded-lg"
                            style={{ backgroundColor: theme[key] }}
                          />
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={resetToDefault}
                    className="w-full mt-6 py-3 rounded-lg text-sm font-medium transition-colors border"
                    style={{
                      borderColor: `${theme.primary}30`,
                      color: theme.primary,
                      backgroundColor: `${theme.primary}05`
                    }}
                  >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Reset to Default
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div 
              className="px-6 py-4 border-t"
              style={{ 
                borderColor: `${theme.primary}20`,
                background: `linear-gradient(135deg, ${theme.primary}05, ${theme.accent}05)`
              }}
            >
              <p className="text-xs text-gray-500 mb-3">Live Preview</p>
              <div className="space-y-2">
                <div 
                  className="h-6 rounded-md flex items-center px-3"
                  style={{ backgroundColor: theme.primary }}
                >
                  <span className="text-white text-xs font-medium">Primary</span>
                </div>
                <div className="flex space-x-2">
                  <div 
                    className="flex-1 h-4 rounded"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div 
                    className="flex-1 h-4 rounded"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ColorPaletteEditor;