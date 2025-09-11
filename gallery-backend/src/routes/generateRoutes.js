import express from 'express';
import Replicate from 'replicate';
import axios from 'axios';
import authMiddleware from '../middleware/authMiddleware.js';
import { saveImageToGallery } from '../services/imageService.js';

const router = express.Router();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

router.post('/', authMiddleware, async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        // 1. Call the Replicate API to start the image generation
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                }
            }
        );
        // The output is a URL to the generated image

        // 2. Download the generated image from the URL
        const imageUrl = output[0];
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        // 3. Use our reusable service to save it to the gallery
        const metadata = {
            title: prompt.slice(0, 50), // Use the prompt as the title
            caption: `AI generated from prompt: "${prompt}"`,
            userId: userId,
            tags: ['ai-generated']
        };
        const newImage = await saveImageToGallery(imageBuffer, metadata);

        res.status(201).json(newImage);

    } catch (error) {
        console.error('AI generation failed:', error);
        res.status(500).json({ error: 'Failed to generate image.' });
    }
});

export default router;