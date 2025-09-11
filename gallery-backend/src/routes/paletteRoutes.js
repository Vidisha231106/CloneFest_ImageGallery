import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// All routes in this file are protected and require a user to be logged in
router.use(authMiddleware);

// GET /api/palettes - Fetch all palettes for the current user
router.get('/', async (req, res) => {
    const userId = req.user.id;

    try {
        const { data, error } = await supabase
            .from('palettes')
            .select('id, name, colors')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to fetch palettes:', error);
        res.status(500).json({ error: 'Could not fetch palettes.' });
    }
});

// POST /api/palettes - Save a new palette for the current user
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { name, colors } = req.body;

    if (!name || !colors) {
        return res.status(400).json({ error: 'Palette name and colors are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('palettes')
            .insert({
                name: name,
                colors: colors,
                user_id: userId
            })
            .select()
            .single(); // .single() returns the created object instead of an array

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Failed to save palette:', error);
        res.status(500).json({ error: 'Could not save the palette.' });
    }
});

export default router;