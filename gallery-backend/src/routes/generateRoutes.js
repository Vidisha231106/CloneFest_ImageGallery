import express from 'express';
import fetch from 'node-fetch';
import authMiddleware from '../middleware/authMiddleware.js';
import { saveImageToGallery } from '../services/imageService.js';

const router = express.Router();

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN; // Free token from huggingface.co

async function generateImageWithHF(prompt) {
    const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                negative_prompt: "blurry, bad quality, distorted, deformed",
                num_inference_steps: 20,
                guidance_scale: 7.5,
                width: 768,
                height: 768,
            }
        }),
    });

    if (!response.ok) {
        if (response.status === 503) {
            throw new Error('Model is loading, please try again in a few seconds');
        }
        if (response.status === 429) {
            throw new Error('Rate limit exceeded, please try again later');
        }
        throw new Error(`Hugging Face API error: ${response.status}`);
    }

    return await response.buffer();
}

router.post('/', authMiddleware, async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (prompt.length > 500) {
        return res.status(400).json({ error: 'Prompt is too long. Maximum 500 characters.' });
    }

    try {
        // 1. Generate image using Hugging Face
        console.log('Generating image with prompt:', prompt.trim());
        const imageBuffer = await generateImageWithHF(prompt.trim());

        // 2. Use our reusable service to save it to the gallery
        const metadata = {
            title: prompt.slice(0, 50), // Use the prompt as the title
            caption: `AI generated from prompt: "${prompt}"`,
            userId: userId,
            tags: ['ai-generated', 'stable-diffusion', 'huggingface']
        };
        const newImage = await saveImageToGallery(imageBuffer, metadata);

        res.status(201).json(newImage);

    } catch (error) {
        console.error('AI generation failed:', error);
        
        // Handle specific errors
        if (error.message?.includes('Model is loading')) {
            return res.status(503).json({ error: 'AI model is starting up, please try again in 30 seconds.' });
        }
        if (error.message?.includes('Rate limit')) {
            return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
        }
        if (error.message?.includes('content policy')) {
            return res.status(400).json({ error: 'Prompt violates content policy. Please try a different prompt.' });
        }
        
        res.status(500).json({ error: 'Failed to generate image. Please try again.' });
    }
});

export default router;