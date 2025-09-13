// src/components/AlbumManager.jsx
import React, { useState, useEffect } from 'react';
import { fetchAlbums, createAlbum, fetchAlbumDetails, addImageToAlbum, removeImageFromAlbum, fetchImages } from '../api';
import { supabase } from '../supabaseClient';
import { BookImage, Plus, X, ImagePlus, Trash2, Check, Square, Image as ImageIcon } from 'lucide-react';

function AlbumManager({ theme }) {
  const [albums, setAlbums] = useState([]);
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  
  // State for adding images
  const [showAddImagesModal, setShowAddImagesModal] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [addingImages, setAddingImages] = useState(new Set());
  
  // State for bulk operations
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  
  // State for drag and drop
  const [draggedImage, setDraggedImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const response = await fetchAlbums();
        setAlbums(response.data);
        setError('');
      } catch (error) {
        console.error("Failed to fetch albums:", error);
        setError('Failed to load albums. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();

    // Set up realtime subscription for albums
    const subscription = supabase
      .channel('albums_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'albums'
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlbums(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setAlbums(prev => prev.filter(album => album.id !== payload.old.id));
            // Close album if it was deleted
            if (selectedAlbum?.id === payload.old.id) {
              setSelectedAlbum(null);
            }
          } else if (payload.eventType === 'UPDATE') {
            setAlbums(prev => prev.map(album => 
              album.id === payload.new.id ? { ...album, ...payload.new } : album
            ));
            // Update selected album if it was updated
            if (selectedAlbum?.id === payload.new.id) {
              setSelectedAlbum(prev => ({ ...prev, ...payload.new }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedAlbum?.id]);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const response = await createAlbum(newAlbumName.trim(), newAlbumDescription.trim());
      setAlbums([response.data, ...albums]);
      setNewAlbumName('');
      setNewAlbumDescription('');
    } catch (error) {
      console.error("Failed to create album:", error);
      setError(error.response?.data?.error || 'Failed to create album. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAlbum = async (albumId) => {
    try {
      setError('');
      const response = await fetchAlbumDetails(albumId);
      setSelectedAlbum(response.data);
      setSelectedImages(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error("Failed to fetch album details:", error);
      setError('Failed to load album details. Please try again.');
    }
  };

  const loadAvailableImages = async () => {
    setLoadingImages(true);
    try {
      const response = await fetchImages();
      const currentImageIds = new Set(selectedAlbum?.images?.map(img => img.id) || []);
      const available = response.data.images.filter(img => !currentImageIds.has(img.id));
      setAvailableImages(available);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setError('Failed to load images. Please try again.');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleOpenAddImages = () => {
    setShowAddImagesModal(true);
    loadAvailableImages();
    setSelectedImages(new Set());
  };

  const handleAddImageToAlbum = async (imageId) => {
    if (!selectedAlbum) return;

    setAddingImages(prev => new Set(prev).add(imageId));
    
    try {
      await addImageToAlbum(selectedAlbum.id, imageId);
      const response = await fetchAlbumDetails(selectedAlbum.id);
      setSelectedAlbum(response.data);
      setAvailableImages(prev => prev.filter(img => img.id !== imageId));
      
      // Update the album in the albums list to reflect the new image
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === selectedAlbum.id 
            ? { ...album, images: response.data.images }
            : album
        )
      );
    } catch (error) {
      console.error("Failed to add image to album:", error);
    } finally {
      setAddingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  // Remove single image from album
  const handleRemoveImageFromAlbum = async (imageId) => {
    if (!selectedAlbum || !confirm('Are you sure you want to remove this image from the album?')) return;

    try {
      await removeImageFromAlbum(selectedAlbum.id, imageId);
      const response = await fetchAlbumDetails(selectedAlbum.id);
      setSelectedAlbum(response.data);
      
      // Update the album in the albums list to reflect the removed image
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === selectedAlbum.id 
            ? { ...album, images: response.data.images }
            : album
        )
      );
    } catch (error) {
      console.error("Failed to remove image from album:", error);
      setError('Failed to remove image. Please try again.');
    }
  };

  // Bulk add selected images
  const handleBulkAdd = async () => {
    if (selectedImages.size === 0) return;

    const imagesToAdd = Array.from(selectedImages);
    const addPromises = imagesToAdd.map(imageId => handleAddImageToAlbum(imageId));
    
    await Promise.all(addPromises);
    setSelectedImages(new Set());
  };

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Select all visible images
  const selectAllImages = () => {
    const allImageIds = new Set(availableImages.map(img => img.id));
    setSelectedImages(allImageIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  // Drag and drop handlers
  const handleDragStart = (e, image) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedImage && selectedAlbum) {
      await handleAddImageToAlbum(draggedImage.id);
    }
    setDraggedImage(null);
  };

  // Get the latest (most recently added) image from an album
  const getAlbumPreviewImage = (album) => {
    if (!album.images || album.images.length === 0) return null;
    // Return the last image in the array (most recently added)
    return album.images[album.images.length - 1];
  };

  if (loading) return <p>Loading albums...</p>;

  // Album detail view
  if (selectedAlbum) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setSelectedAlbum(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Albums
          </button>
          <button
            onClick={handleOpenAddImages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: theme.primary }}
          >
            <ImagePlus size={16} />
            Add Images
          </button>
        </div>

        <h2 style={{ color: theme.primary }}>{selectedAlbum.name}</h2>
        <p className="text-gray-600 mb-4">{selectedAlbum.description}</p>
        
        {selectedAlbum.images && selectedAlbum.images.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {selectedAlbum.images.length} image{selectedAlbum.images.length !== 1 ? 's' : ''} in this album
            </p>
          </div>
        )}

        <div 
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
            isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4 rounded-lg' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedAlbum.images?.map(image => (
            <div key={image.id} className="relative group">
              <img
                src={image.thumbnail_url || image.url}
                alt={image.title}
                className="rounded-lg shadow-md aspect-square object-cover w-full"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRemoveImageFromAlbum(image.id)}
                  className="p-1 bg-black text-white rounded-full hover:bg-black"
                  title="Remove from album"
                >
                  <Trash2 size={30} />
                </button>
              </div>
              <p className="text-sm mt-1 truncate">{image.title}</p>
            </div>
          ))}
          
          {(!selectedAlbum.images || selectedAlbum.images.length === 0) && (
            <div className="col-span-full text-center py-16">
              <ImagePlus size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-700 mb-3">This album is empty</h3>
              <p className="text-gray-500 mb-6 text-lg">Add some images from your gallery to get started!</p>
              <button
                onClick={handleOpenAddImages}
                className="px-6 py-3 rounded-lg text-white font-medium text-lg"
                style={{ backgroundColor: theme.primary }}
              >
                Add Images
              </button>
            </div>
          )}
        </div>

        {isDragOver && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center bg-blue-500 bg-opacity-20">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-medium">Drop image to add to album</p>
            </div>
          </div>
        )}

        {/* Add Images Modal */}
        {showAddImagesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Add Images to Album</h3>
                <button
                  onClick={() => setShowAddImagesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Bulk selection controls */}
              {availableImages.length > 0 && (
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    <Square size={16} />
                    {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
                  </button>
                  
                  {bulkMode && (
                    <>
                      <span className="text-sm text-gray-600">
                        {selectedImages.size} selected
                      </span>
                      <button
                        onClick={selectAllImages}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Clear
                      </button>
                      {selectedImages.size > 0 && (
                        <button
                          onClick={handleBulkAdd}
                          className="px-4 py-2 bg-green-500 text-white rounded text-sm"
                        >
                          Add Selected ({selectedImages.size})
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {loadingImages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh]">
                  {availableImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {availableImages.map(image => (
                        <div 
                          key={image.id} 
                          className={`relative group cursor-pointer ${
                            selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''
                          }`}
                          draggable={!bulkMode}
                          onDragStart={(e) => handleDragStart(e, image)}
                        >
                          {bulkMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleImageSelection(image.id);
                                }}
                                className="p-1 bg-white rounded border"
                              >
                                {selectedImages.has(image.id) ? (
                                  <Check size={14} className="text-blue-500" />
                                ) : (
                                  <Square size={14} />
                                )}
                              </button>
                            </div>
                          )}
                          
                          <img
                            src={image.thumbnail_url || image.url}
                            alt={image.title}
                            className="rounded-lg aspect-square object-cover w-full"
                            onClick={() => bulkMode && toggleImageSelection(image.id)}
                          />
                          
                          {!bulkMode && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => handleAddImageToAlbum(image.id)}
                                disabled={addingImages.has(image.id)}
                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white text-black rounded-md text-sm font-medium disabled:opacity-50"
                              >
                                {addingImages.has(image.id) ? 'Adding...' : 'Add'}
                              </button>
                            </div>
                          )}
                          
                          <p className="text-xs mt-1 truncate" title={image.title}>
                            {image.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No images available to add to this album.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can also drag images from your gallery directly onto the album to add them!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Albums list view
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>Manage Albums</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create New Album Form */}
      <div className="mb-8 p-4 border rounded-lg" style={{ borderColor: theme.secondary + '30' }}>
        <h3 className="text-lg font-semibold mb-4">Create New Album</h3>
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Album name"
            className="w-full p-3 border rounded-lg"
            disabled={creating}
          />
          <textarea
            value={newAlbumDescription}
            onChange={(e) => setNewAlbumDescription(e.target.value)}
            placeholder="Album description (optional)"
            className="w-full p-3 border rounded-lg"
            rows="3"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newAlbumName.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.primary }}
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Album
              </>
            )}
          </button>
        </form>
      </div>

      {/* Album List with Preview Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.filter(album => album && album.id).map(album => {
          const previewImage = getAlbumPreviewImage(album);
          const imageCount = album.images ? album.images.length : 0;
          
          return (
            <div
              key={album.id}
              onClick={() => handleSelectAlbum(album.id)}
              className="border rounded-lg cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              style={{ borderColor: theme.secondary + '30' }}
            >
              {/* Preview Image Section */}
              <div className="relative h-48 bg-gray-100">
                {previewImage ? (
                  <div className="relative h-full">
                    <img
                      src={previewImage.thumbnail_url || previewImage.url}
                      alt={previewImage.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Image count overlay */}
                    {imageCount > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon size={12} />
                        {imageCount}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BookImage size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 text-sm">No images</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Album Info Section */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg" style={{ color: theme.primary }}>
                    {album.name || 'Untitled Album'}
                  </h3>
                  <BookImage size={20} style={{ color: theme.primary }} className="flex-shrink-0 mt-1" />
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {album.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {imageCount} {imageCount === 1 ? 'image' : 'images'}
                  </span>
                  {previewImage && (
                    <span className="flex items-center gap-1">
                      Latest: {previewImage.title.length > 15 
                        ? previewImage.title.substring(0, 15) + '...' 
                        : previewImage.title}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {albums.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookImage size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No albums created yet. Create your first album to get started!</p>
        </div>
      )}
    </div>
  );
}

export default AlbumManager;