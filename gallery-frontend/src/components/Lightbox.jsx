import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Edit3, Trash2, BookImage, Edit } from 'lucide-react';
import MetadataEditor from './MetadataEditor';
import ImageEditor from './ImageEditor';
import { fetchAlbums, addImageToAlbum } from '../api';

function Lightbox({ image, onClose, onNext, onPrev, onUpdate, onDelete, canEdit, theme }) {
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showAlbumList, setShowAlbumList] = useState(false);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (showImageEditor || showMetadataEditor) {
            setShowImageEditor(false);
            setShowMetadataEditor(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (!showImageEditor && !showMetadataEditor) {
            onPrev();
          }
          break;
        case 'ArrowRight':
          if (!showImageEditor && !showMetadataEditor) {
            onNext();
          }
          break;
        case 'e':
        case 'E':
          if (canEdit && !showMetadataEditor) {
            setShowImageEditor(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNext, onPrev, canEdit, showImageEditor, showMetadataEditor]);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const albumsData = await fetchAlbums();
        setAlbums(albumsData);
      } catch (error) {
        console.error('Failed to load albums:', error);
      }
    };
    
    if (showAlbumList) {
      loadAlbums();
    }
  }, [showAlbumList]);

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

  const handleImageSave = async (editedBlob, editData) => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      // Create a new filename with editing info
      const timestamp = Date.now();
      const filename = `edited_${timestamp}_${image.title || 'image'}.png`;
      
      formData.append('images', editedBlob, filename);
      formData.append('title', `${image.title || 'Image'} (Edited)`);
      formData.append('caption', `Edited version - Brightness: ${editData.brightness}, Filter: ${editData.filter}`);
      formData.append('tags', JSON.stringify([...(image.tags || []), 'edited', `filter-${editData.filter}`]));
      
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // Add the new edited image to the gallery
        if (result.images && result.images.length > 0) {
          // This would need to be passed from the parent component
          // For now, we'll just close the editor
          setShowImageEditor(false);
          alert('Edited image saved successfully!');
        }
      } else {
        throw new Error('Failed to save edited image');
      }
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Failed to save edited image. Please try again.');
    }
  };

  const handleAddToAlbum = async (albumId) => {
    try {
      await addImageToAlbum(albumId, image.id);
      setShowAlbumList(false);
      alert('Image added to album successfully!');
    } catch (error) {
      console.error('Failed to add image to album:', error);
      alert('Failed to add image to album.');
    }
  };

  // Don't render lightbox content if image editor is open
  if (showImageEditor) {
    return (
      <ImageEditor
        originalImageUrl={image.url}
        onSave={handleImageSave}
        onCancel={() => setShowImageEditor(false)}
        theme={theme}
      />
    );
  }

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

      {/* Edit Actions Bar */}
      {canEdit && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
          <button
            onClick={() => setShowImageEditor(true)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
            title="Edit Image (Press E)"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMetadataEditor(true)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
            title="Edit Metadata"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAlbumList(!showAlbumList)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white relative"
            title="Add to Album"
          >
            <BookImage className="w-5 h-5" />
            {/* Album Dropdown */}
            {showAlbumList && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg overflow-hidden">
                <p className="text-xs font-bold p-2 border-b bg-gray-50">Add to album...</p>
                <ul className="max-h-40 overflow-y-auto">
                  {albums.map(album => (
                    <li
                      key={album.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToAlbum(album.id);
                      }}
                      className="p-2 text-sm hover:bg-gray-100 cursor-pointer"
                    >
                      {album.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-600 hover:bg-opacity-50 rounded-full transition-colors text-white"
            title="Delete Image"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

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

          {canEdit && (
            <div className="mt-4 pt-3 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                Press <kbd className="bg-gray-700 px-1 rounded">E</kbd> to edit image, or use the buttons above
              </p>
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
          theme={theme}
        />
      )}
    </div>
  );
}

export default Lightbox;