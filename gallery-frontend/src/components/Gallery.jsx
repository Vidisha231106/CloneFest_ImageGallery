import React, { useState } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import Lightbox from './Lightbox';

function Gallery({ images, onImageUpdate, onImageDelete, currentUser, theme }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleQuickDelete = async (e, imageId) => {
    e.stopPropagation(); // Prevent opening lightbox
    
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await onImageDelete(imageId);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div 
          className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <span className="text-4xl" style={{ color: theme.primary }}>📸</span>
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>No images yet</h3>
        <p className="text-gray-600 mb-6">Start by uploading some beautiful images to your gallery</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
          Image Gallery
        </h2>
        <p className="text-gray-600">
          {images.length} images in your collection
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            onClick={() => handleImageClick(index)}
            onQuickDelete={(e) => handleQuickDelete(e, image.id)}
            canEdit={!!currentUser}
            theme={theme}
          />
        ))}
      </div>

      {selectedImageIndex !== null && (
        <Lightbox
          image={images[selectedImageIndex]}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          onUpdate={onImageUpdate}
          onDelete={onImageDelete}
          canEdit={!!currentUser}
          theme={theme}
        />
      )}
    </>
  );
}

function ImageCard({ image, index, onClick, onQuickDelete, canEdit, theme }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <div
      className="group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden relative"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        borderTop: `3px solid ${theme.primary}`,
        background: `linear-gradient(145deg, ${theme.background}, ${theme.background}f5)`
      }}
    >
      {/* Quick Action Buttons */}
      {canEdit && (
        <div 
          className={`absolute top-2 right-2 z-10 flex space-x-1 transition-all duration-300 ${
            showActions ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(); // Open lightbox in edit mode
            }}
            className="p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-all duration-200 hover:scale-110"
            title="View/Edit Image"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onQuickDelete}
            className="p-2 bg-red-600 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all duration-200 hover:scale-110"
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Badge */}
      {image.tags && image.tags.includes('edited') && (
        <div 
          className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white"
        >
          Edited
        </div>
      )}

      <div className="aspect-square overflow-hidden relative">
        {!imageLoaded && !imageError && (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}10` }}
          >
            <div 
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
            />
          </div>
        )}
        
        {imageError ? (
          <div 
            className="w-full h-full flex items-center justify-center flex-col"
            style={{ backgroundColor: `${theme.secondary}20` }}
          >
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-sm" style={{ color: theme.secondary }}>Failed to load</p>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.altText || image.title}
            className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {imageLoaded && !imageError && (
          <>
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-bold text-lg mb-1 truncate">{image.title}</h3>
              {image.caption && (
                <p className="text-sm opacity-90 line-clamp-2">{image.caption}</p>
              )}
              {canEdit && (
                <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-white border-opacity-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(); // Open in edit mode
                    }}
                    className="flex items-center space-x-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold truncate mb-1" style={{ color: theme.text }}>
            {image.title}
          </h3>
          {image.caption && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{image.caption}</p>
          )}
        </div>
        
        {image.tags && image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full text-white text-opacity-90"
                style={{ 
                  backgroundColor: theme.primary,
                  background: `linear-gradient(45deg, ${theme.primary}, ${theme.accent})`
                }}
              >
                {tag}
              </span>
            ))}
            {image.tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;