import React, { useState } from 'react';
import { Search, Upload, Image as ImageIcon } from 'lucide-react';

function VectorSearch({ images, theme = {} }) {
  const [searchType, setSearchType] = useState('text');
  const [textQuery, setTextQuery] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default theme values in case theme is undefined
  const safeTheme = {
    background: theme?.background || '#ffffff',
    text: theme?.text || '#1f2937',
    primary: theme?.primary || '#3b82f6',
    secondary: theme?.secondary || '#6b7280',
    accent: theme?.accent || '#10b981',
    ...theme
  };

  const handleTextSearch = async (e) => {
    e.preventDefault();
    if (!textQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate semantic search
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock semantic matching based on tags and descriptions
      const results = images.filter(img => {
        const searchableText = [
          img.title,
          img.caption,
          ...(img.tags || [])
        ].join(' ').toLowerCase();
        const queryWords = textQuery.toLowerCase().split(' ');
        return queryWords.some(word => searchableText.includes(word));
      }).slice(0, 6);
      
      setSearchResults(results);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setLoading(true);
    try {
      // Simulate image-to-image search
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock similar image results (randomly select images for demo)
      const shuffled = [...images].sort(() => 0.5 - Math.random());
      const results = shuffled.slice(0, 4);
      setSearchResults(results);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  return (
    <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: safeTheme.background }}>
      <div className="flex items-center space-x-2 mb-6">
        <Search className="w-6 h-6" style={{ color: safeTheme.primary }} />
        <h3 className="text-xl font-semibold" style={{ color: safeTheme.text }}>
          Advanced Search
        </h3>
      </div>

      {/* Search Type Toggle */}
      <div className="flex space-x-1 rounded-lg p-1 mb-6" 
           style={{ backgroundColor: safeTheme.secondary + '20' }}>
        <button
          onClick={() => setSearchType('text')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            searchType === 'text' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: searchType === 'text' ? safeTheme.background : 'transparent',
            color: searchType === 'text' ? safeTheme.primary : safeTheme.secondary
          }}
        >
          <Search className="w-4 h-4" />
          <span>Text Search</span>
        </button>
        <button
          onClick={() => setSearchType('image')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            searchType === 'image' ? 'shadow-sm' : ''
          }`}
          style={{
            backgroundColor: searchType === 'image' ? safeTheme.background : 'transparent',
            color: searchType === 'image' ? safeTheme.primary : safeTheme.secondary
          }}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image Search</span>
        </button>
      </div>

      {/* Search Forms */}
      {searchType === 'text' ? (
        <form onSubmit={handleTextSearch} className="mb-6">
          <div className="mb-4">
            <label htmlFor="textQuery" className="block text-sm font-medium mb-2" style={{ color: safeTheme.text }}>
              Semantic Text Search
            </label>
            <input
              type="text"
              id="textQuery"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
              style={{
                borderColor: safeTheme.secondary,
                backgroundColor: safeTheme.background,
                color: safeTheme.text,
                focusRingColor: safeTheme.primary
              }}
              placeholder="Describe what you're looking for..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !textQuery.trim()}
            className="w-full py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: safeTheme.primary,
              color: 'white'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleImageSearch} className="mb-6">
          <div className="mb-4">
            <label htmlFor="imageFile" className="block text-sm font-medium mb-2" style={{ color: safeTheme.text }}>
              Find Similar Images
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold transition-all duration-200"
                style={{
                  color: safeTheme.secondary,
                  fileBackgroundColor: safeTheme.primary + '20',
                  fileColor: safeTheme.primary
                }}
              />
              <Upload className="w-5 h-5" style={{ color: safeTheme.secondary }} />
            </div>
            {imageFile && (
              <p className="text-sm mt-2" style={{ color: safeTheme.accent }}>
                Selected: {imageFile.name}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !imageFile}
            className="w-full py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: safeTheme.primary,
              color: 'white'
            }}
          >
            {loading ? 'Finding Similar Images...' : 'Find Similar'}
          </button>
        </form>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: safeTheme.text }}>
            Search Results ({searchResults.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {searchResults.map((image) => (
              <div key={image.id} className="rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                   style={{ backgroundColor: safeTheme.secondary + '10' }}>
                <img
                  src={image.url}
                  alt={image.altText || image.title}
                  className="w-full h-24 object-cover"
                />
                <div className="p-2">
                  <h5 className="text-sm font-medium truncate mb-1" style={{ color: safeTheme.text }}>
                    {image.title}
                  </h5>
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: safeTheme.primary + '20',
                            color: safeTheme.primary
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: safeTheme.primary, borderTopColor: 'transparent' }}></div>
          <p style={{ color: safeTheme.secondary }}>
            {searchType === 'text' ? 'Analyzing semantic meaning...' : 'Analyzing visual similarity...'}
          </p>
        </div>
      )}

      {/* No Results */}
      {!loading && searchResults.length === 0 && (textQuery || imageFile) && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No results found</p>
          <p className="text-xs mt-1">Try different keywords or upload a different image</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && searchResults.length === 0 && !textQuery && !imageFile && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Search your image collection</p>
          <p className="text-xs mt-1">Use text descriptions or upload an image to find similar ones</p>
        </div>
      )}
    </div>
  );
}

export default VectorSearch;
