import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import MetadataEditor from './MetadataEditor';

function Lightbox({ image, onClose, onNext, onPrev, onUpdate, onDelete, canEdit }) {
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNext, onPrev]);

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      onDelete(image.id);
      onClose();
    }
  };

  const handleMetadataUpdate = (updates) => {
    onUpdate(image.id, updates);
    setShowMetadataEditor(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center max-w-7xl max-h-[80vh]">
          <img
            src={image.url}
            alt={image.altText || image.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Image Info */}
        <div className="bg-black bg-opacity-60 text-white rounded-lg p-4 mt-4 max-w-2xl w-full">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-semibold">{image.title}</h2>
            {canEdit && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMetadataEditor(true)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Edit metadata"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 hover:bg-red-600 hover:bg-opacity-50 rounded transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {image.caption && (
            <p className="text-gray-300 mb-3">{image.caption}</p>
          )}

          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {image.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-600 bg-opacity-80 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metadata Editor Modal */}
      {showMetadataEditor && (
        <MetadataEditor
          image={image}
          onSave={handleMetadataUpdate}
          onClose={() => setShowMetadataEditor(false)}
        />
      )}
    </div>
  );
}

export default Lightbox;