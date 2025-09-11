import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon } from 'lucide-react';

function AIImageGenerator({ onImagesGenerated, theme = {} }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);

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
    "Abstract geometric patterns in vibrant colors",
    "A cozy coffee shop in autumn",
    "Futuristic city skyline at night",
    "Peaceful zen garden with flowing water"
  ];

  const generateImages = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock images
      const mockImages = Array.from({ length: 4 }, (_, i) => ({
        id: Date.now() + i,
        url: `https://picsum.photos/512/512?random=${Date.now() + i}`,
        title: `Generated: ${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        caption: `AI generated image from prompt: "${prompt}"`,
        altText: `AI generated image: ${prompt}`,
        tags: ['ai-generated', 'artificial-intelligence', prompt.split(' ')[0]?.toLowerCase()].filter(Boolean),
        prompt: prompt,
        generatedAt: new Date().toISOString()
      }));
      
      setGeneratedImages(mockImages);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = (images) => {
    if (onImagesGenerated) {
      onImagesGenerated(images);
    }
    setGeneratedImages([]);
    setPrompt('');
  };

  return (
    <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: safeTheme.background }}>
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-6 h-6" style={{ color: safeTheme.primary }} />
        <h3 className="text-xl font-semibold" style={{ color: safeTheme.text }}>
          AI Image Generator
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
        />
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
              className="text-xs px-3 py-1 rounded-full border transition-all duration-200 hover:opacity-80"
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
            <span>Generating Images...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate Images</span>
          </div>
        )}
      </button>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
               style={{ borderColor: safeTheme.primary, borderTopColor: 'transparent' }}></div>
          <p className="text-sm">Creating your masterpiece...</p>
          <p className="text-xs mt-1">This usually takes 2-3 seconds</p>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium" style={{ color: safeTheme.text }}>
              Generated Images ({generatedImages.length})
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

          <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((image) => (
              <div
                key={image.id}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                style={{ backgroundColor: safeTheme.secondary + '10' }}
              >
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h5 className="text-sm font-medium mb-1 truncate" style={{ color: safeTheme.text }}>
                    {image.title}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 2).map((tag, i) => (
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
              Click "Save to Gallery" to add these images to your collection
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && generatedImages.length === 0 && (
        <div className="text-center py-8" style={{ color: safeTheme.secondary }}>
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Your generated images will appear here</p>
        </div>
      )}
    </div>
  );
}

export default AIImageGenerator;