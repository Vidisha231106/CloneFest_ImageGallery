// src/components/AlbumManager.jsx
import React, { useState, useEffect } from 'react';
import { fetchAlbums, createAlbum, fetchAlbumDetails } from '../api'; // Adjust path as needed
import { BookImage, Plus } from 'lucide-react';

function AlbumManager({ theme }) {
  const [albums, setAlbums] = useState([]);
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch all albums when the component loads
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
  }, []);

  // Handle creating a new album
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const response = await createAlbum(newAlbumName.trim(), ''); // Pass empty description
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

  // Handle selecting an album to view its details
  const handleSelectAlbum = async (albumId) => {
    try {
      setError('');
      const response = await fetchAlbumDetails(albumId);
      console.log('Album details response:', response);
      console.log('Album data:', response.data);
      setSelectedAlbum(response.data);
    } catch (error) {
      console.error("Failed to fetch album details:", error);
      setError('Failed to load album details. Please try again.');
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
          {selectedAlbum.images?.map(img => (
            <img key={img.id} src={img.url} alt={img.title} className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Display the list of all albums and the creation form
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>Manage Albums</h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create New Album Form */}
      <form onSubmit={handleCreateAlbum} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          placeholder="New album name"
          className="flex-grow p-2 border rounded-lg"
          disabled={creating}
        />

        <textarea
          value={newAlbumDescription}
          onChange={(e) => setNewAlbumDescription(e.target.value)}
          placeholder="Album description (optional)"
          className="w-full p-2 border rounded-lg"
          rows="2"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newAlbumName.trim()}
          className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.primary }}
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Plus />
          )}
        </button>
      </form>

      {/* Album List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {albums.filter(album => album && album.id).map(album => (
          <div
            key={album.id}
            onClick={() => handleSelectAlbum(album.id)}
            className="p-4 border rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            style={{ borderColor: theme.secondary + '30' }}
          >
            <BookImage className="mb-2" style={{ color: theme.primary }} />
            <h3 className="font-semibold">{album.name || 'Untitled Album'}</h3>
            <p className="text-sm">{album.description || 'No description'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlbumManager;