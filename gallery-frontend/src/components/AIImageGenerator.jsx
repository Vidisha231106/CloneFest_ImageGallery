import React, { useState } from 'react';
// 1. Import the CheckCircle icon for the success message
import { Sparkles, Download, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { generateImage } from '../api';

function AIImageGenerator({ onImagesGenerated, theme = {} }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  // 2. Add state to manage the success pop-up visibility
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [error, setError] = useState('');

  // Default theme values in case theme is undefined
  const safeTheme = {
    background: theme?.background || '#ffffff',
    text: theme?.text || '#1f2937',
    primary: theme?.primary || '#3b82f6',
    secondary: theme?.secondary || '#6b7280',
    accent: theme?.accent || '#10b981',
    ...theme
  };

  const samplePrompts = [
    "A serene mountain landscape at sunset",
    "A futuristic city with flying cars and neon lights",
    "A magical forest with glowing mushrooms and fairy lights",
    "An astronaut riding a horse on the moon"
  ];

  const generateImages = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Use the centralized API function
      const response = await generateImage(prompt.trim());
      const generatedImage = response.data;
      
      // Transform the backend response to match your existing format
      const formattedImage = {
        id: generatedImage._id || generatedImage.id || Date.now(),
        url: generatedImage.imageUrl || generatedImage.url,
        title: generatedImage.title || `Generated: ${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        caption: generatedImage.caption || `AI generated image from prompt: "${prompt}"`,
        altText: `AI generated image: ${prompt}`,
        tags: generatedImage.tags || ['ai-generated', 'stable-diffusion'],
        prompt: prompt,
        generatedAt: generatedImage.createdAt || new Date().toISOString()
      };
      
      setGeneratedImages([formattedImage]); // Backend returns one image
      
    } catch (error) {
      console.error('Generation failed:', error);
      
      // Handle axios error responses
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 3. Update the saveToGallery function
  const saveToGallery = (images) => {
    if (onImagesGenerated) {
      onImagesGenerated(images);
    }
    setGeneratedImages([]);
    setPrompt('');
    
    // Show the success pop-up
    setShowSuccessPopup(true);
    
    // Automatically hide the pop-up after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  const dismissError = () => {
    setError('');
  };

  return (
    // 4. Add `relative` positioning to the main container for the pop-up
    <div className="rounded-lg shadow-md p-6 relative" style={{ backgroundColor: safeTheme.background }}>
      
      {/* 5. Add the Success Popup component */}
      {showSuccessPopup && (
        <div 
          className="absolute top-5 right-5 flex items-center bg-green-100 text-green-700 px-4 py-3 rounded-lg shadow-md z-50 animate-fade-in-down"
          role="alert"
        >
          <CheckCircle className="w-5 h-5 mr-3" />
          <span className="font-medium">Image saved to gallery!</span>
        </div>
      )}

      {/* Error Popup */}
      {error && (
        <div 
          className="absolute top-5 right-5 flex items-center bg-red-100 text-red-700 px-4 py-3 rounded-lg shadow-md z-50 max-w-sm"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-sm">{error}</span>
          </div>
          <button 
            onClick={dismissError}
            className="ml-2 text-red-700 hover:text-red-900 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-6 h-6" style={{ color: safeTheme.primary }} />
        <h3 className="text-xl font-semibold" style={{ color: safeTheme.text }}>
          AI Image Generator
          <span className="text-sm font-normal ml-2" style={{ color: safeTheme.secondary }}>
            Powered by Stable Diffusion
          </span>
        </h3>
      </div>

      {/* Prompt Input */}
      <div className="mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium mb-2" style={{ color: safeTheme.text }}>
          Describe what you want to create
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:border-transparent transition-all duration-200"
          style={{
            borderColor: safeTheme.secondary,
            backgroundColor: safeTheme.background,
            color: safeTheme.text,
            focusRingColor: safeTheme.primary
          }}
          rows="3"
          placeholder="A magical forest with glowing mushrooms and fairy lights..."
          maxLength={1000}
        />
        <div className="text-xs mt-1 flex justify-between">
          <span style={{ color: safeTheme.secondary }}>
            {prompt.length}/1000 characters
          </span>
          <span className="text-xs" style={{ color: safeTheme.secondary }}>
            🤗 Free AI image generation!
          </span>
        </div>
      </div>

      {/* Sample Prompts */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2" style={{ color: safeTheme.text }}>
          Try these examples:
        </p>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((samplePrompt, index) => (
            <button
              key={index}
              onClick={() => setPrompt(samplePrompt)}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full border transition-all duration-200 hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: safeTheme.primary,
                color: safeTheme.primary,
                backgroundColor: safeTheme.primary + '10'
              }}
            >
              {samplePrompt}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateImages}
        disabled={loading || !prompt.trim()}
        className="w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90 mb-6"
        style={{
          backgroundColor: safeTheme.primary,
          color: 'white'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Generating Image...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate Image</span>
          </div>
        )}
      </button>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: safeTheme.primary, borderTopColor: 'transparent' }}></div>
          <p className="text-sm">Creating your masterpiece...</p>
          <p className="text-xs mt-1">This usually takes 30-60 seconds</p>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium" style={{ color: safeTheme.text }}>
              Generated Image
            </h4>
            <button
              onClick={() => saveToGallery(generatedImages)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: safeTheme.accent,
                color: 'white'
              }}
            >
              <Download className="w-4 h-4" />
              <span>Save to Gallery</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {generatedImages.map((image) => (
              <div
                key={image.id}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                style={{ backgroundColor: safeTheme.secondary + '10' }}
              >
                <div className="aspect-square max-w-lg mx-auto">
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIyNTYiIHk9IjI1NiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
                <div className="p-3">
                  <h5 className="text-sm font-medium mb-1 truncate" style={{ color: safeTheme.text }}>
                    {image.title}
                  </h5>
                  <p className="text-xs mb-2" style={{ color: safeTheme.secondary }}>
                    {image.caption}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: safeTheme.primary + '20',
                          color: safeTheme.primary
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm" style={{ color: safeTheme.secondary }}>
              Click "Save to Gallery" to add this image to your collection
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && generatedImages.length === 0 && !error && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Your generated image will appear here</p>
          <p className="text-xs mt-1">Powered by Stable Diffusion XL</p>
        </div>
      )}
    </div>
  );
}

export default AIImageGenerator;