import React, { useState } from 'react';
import { X, Save, Plus, Minus } from 'lucide-react';

function MetadataEditor({ image, onSave, onClose, theme }) {
  const [formData, setFormData] = useState({
    title: image.title || '',
    caption: image.caption || '',
    tags: image.tags ? [...image.tags] : [],
    altText: image.altText || ''
  });
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name === 'newTag') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.primary + '20' }}>
          <h3 className="text-xl font-semibold">Edit Image Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            style={{ color: theme.secondary }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: theme.secondary + '40',
                backgroundColor: theme.background,
                color: theme.text,
                '--tw-ring-color': theme.primary + '50'
              }}
              placeholder="Enter image title..."
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => handleInputChange('caption', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: theme.secondary + '40',
                backgroundColor: theme.background,
                color: theme.text,
                '--tw-ring-color': theme.primary + '50'
              }}
              placeholder="Write a short description..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                name="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 transition-colors"
                style={{ 
                  borderColor: theme.secondary + '40',
                  backgroundColor: theme.background,
                  color: theme.text,
                  '--tw-ring-color': theme.primary + '50'
                }}
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: theme.primary, color: 'white' }}
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: theme.primary + '20', color: theme.text, border: `1px solid ${theme.primary}40` }}
                  >
                    <span>#{tag}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-70 hover:opacity-100">
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Alt text
            </label>
            <input
              type="text"
              value={formData.altText}
              onChange={(e) => handleInputChange('altText', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: theme.secondary + '40',
                backgroundColor: theme.background,
                color: theme.text,
                '--tw-ring-color': theme.primary + '50'
              }}
              placeholder="Describe the image for accessibility"
            />
            <p className="text-xs mt-1" style={{ color: theme.secondary }}>
              Provide a short, meaningful description for screen readers.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: theme.primary + '20' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: theme.secondary + '20', color: theme.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: formData.title.trim() ? theme.primary : theme.secondary, opacity: formData.title.trim() ? 1 : 0.6 }}
              disabled={!formData.title.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MetadataEditor;