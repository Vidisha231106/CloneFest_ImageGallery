// src/components/AlbumManager.jsx
import React, { useState, useEffect } from 'react';
import { fetchAlbums, createAlbum, fetchAlbumDetails } from '../api'; // Adjust path as needed
import { BookImage, Plus } from 'lucide-react';

function AlbumManager({ theme }) {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all albums when the component loads
  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const response = await fetchAlbums();
        setAlbums(response.data);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();
  }, []);

  // Handle creating a new album
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    try {
      const response = await createAlbum(newAlbumName);
      setAlbums([response.data, ...albums]);
      setNewAlbumName('');
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  // Handle selecting an album to view its details
  const handleSelectAlbum = async (albumId) => {
    try {
      const response = await fetchAlbumDetails(albumId);
      setSelectedAlbum(response.data);
    } catch (error) {
      console.error("Failed to fetch album details:", error);
    }
  };

  if (loading) return <p>Loading albums...</p>;

  // Display details of a selected album
  if (selectedAlbum) {
    return (
      <div>
        <button onClick={() => setSelectedAlbum(null)}>&larr; Back to Albums</button>
        <h2 style={{ color: theme.primary }}>{selectedAlbum.name}</h2>
        <p>{selectedAlbum.description}</p>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {selectedAlbum.images.map(img => (
            <img key={img.id} src={img.url} alt={img.title} className="rounded-lg"/>
          ))}
        </div>
      </div>
    );
  }

  // Display the list of all albums and the creation form
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>Manage Albums</h2>
      
      {/* Create New Album Form */}
      <form onSubmit={handleCreateAlbum} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          placeholder="New album name"
          className="flex-grow p-2 border rounded-lg"
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: theme.primary }}>
          <Plus />
        </button>
      </form>

      {/* Album List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {albums.map(album => (
          <div
            key={album.id}
            onClick={() => handleSelectAlbum(album.id)}
            className="p-4 border rounded-lg cursor-pointer hover:shadow-lg"
            style={{ borderColor: theme.secondary + '30' }}
          >
            <BookImage className="mb-2" style={{ color: theme.primary }} />
            <h3 className="font-semibold">{album.name}</h3>
            <p className="text-sm">{album.description || 'No description'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlbumManager;