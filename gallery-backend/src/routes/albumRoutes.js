import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Protect all routes in this file. A user must be logged in.
router.use(authMiddleware);

// ## GET /api/albums: Fetches all albums for the logged-in user
router.get('/', async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('albums')
            .select('id, name, description')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch albums.' });
    }
});

// ## POST /api/albums: Creates a new, empty album
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Album name is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('albums')
            .insert({ name, description, user_id: userId })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Could not create album.' });
    }
});

// ## GET /api/albums/:id: Fetches a single album and its images
router.get('/:id', async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('albums')
            .select(`
        id,
        name,
        description,
        images ( id, title, url )
      `)
            .eq('user_id', userId)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Album not found.' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch album details.' });
    }
});

// ## POST /api/albums/:id/images: Adds an existing image to an album
router.post('/:id/images', async (req, res) => {
    const { id: albumId } = req.params;
    const { imageId } = req.body;

    if (!imageId) {
        return res.status(400).json({ error: 'Image ID is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('album_images')
            .insert({ album_id: albumId, image_id: imageId })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        // Handle cases where the image is already in the album (primary key violation)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Image is already in this album.' });
        }
        res.status(500).json({ error: 'Could not add image to album.' });
    }
});

// ## DELETE /api/albums/:albumId/images/:imageId: Removes an image from an album
router.delete('/:albumId/images/:imageId', async (req, res) => {
    const { albumId, imageId } = req.params;

    try {
        const { error } = await supabase
            .from('album_images')
            .delete()
            .eq('album_id', albumId)
            .eq('image_id', imageId);

        if (error) throw error;
        res.status(204).send(); // Success, no content to return
    } catch (error) {
        res.status(500).json({ error: 'Could not remove image from album.' });
    }
});

// ## DELETE /api/albums/:id: Deletes an entire album
router.delete('/:id', async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('albums')
            .delete()
            .eq('user_id', userId)
            .eq('id', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Could not delete album.' });
    }
});

export default router;