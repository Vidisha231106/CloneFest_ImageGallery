// For this example, we'll use the Hugging Face Transformers.js library,
// which runs directly in Node.js without needing a separate API key.
// Install it: npm install @xenova/transformers

import { pipeline } from '@xenova/transformers';

// This is a "singleton" pattern to ensure we only load the AI model once.
class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2'; // A great starting model
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }
}

/**
 * Generates a vector embedding for a given text string.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The vector embedding.
 */
export const generateEmbeddingForText = async (text) => {
  const extractor = await EmbeddingPipeline.getInstance();
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
};

/**
 * Generates a vector embedding for an image.
 * (This is a more advanced feature and often requires a different, multimodal model)
 * @param {Buffer} imageBuffer - The image file buffer.
 * @returns {Promise<number[]>} - The vector embedding.
 */
export const generateEmbeddingForImage = async (imageBuffer) => {
  // NOTE: The 'Xenova/all-MiniLM-L6-v2' model is for text only.
  // For true image-to-image search, you'd need a multimodal model like 'Xenova/clip-vit-base-patch32'.
  // For now, we'll throw an error to indicate it's not implemented.
  console.warn("Image embedding is not fully implemented with the current text model.");
  // To implement this, you would load a CLIP model and process the image buffer.
  throw new Error("Image embedding not implemented.");
};