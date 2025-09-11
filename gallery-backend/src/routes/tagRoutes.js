// src/routes/tagRoutes.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// GET /api/tags - Get all tags with usage counts
router.get('/', async (req, res) => {
    const { category_id, popular } = req.query;

    try {
        let query = supabase
            .from('tags')
            .select(`
                *,
                image_tags!inner(count),
                tag_category:category_id(id, name, color)
            `);

        // Filter by category if specified
        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        // Order by popularity if requested
        if (popular === 'true') {
            query = query.order('usage_count', { ascending: false });
        } else {
            query = query.order('name', { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate usage counts from the join
        const tagsWithCounts = data.map(tag => ({
            ...tag,
            usage_count: tag.image_tags?.length || 0
        }));

        res.status(200).json(tagsWithCounts);
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        res.status(500).json({ error: 'Could not fetch tags.' });
    }
});

// GET /api/tags/search - Search tags by name
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('tags')
            .select(`
                *,
                tag_category:category_id(id, name, color)
            `)
            .ilike('name', `%${q}%`)
            .order('usage_count', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Tag search failed:', error);
        res.status(500).json({ error: 'Tag search failed.' });
    }
});

// POST /api/tags - Create a new tag
router.post('/', authMiddleware, checkPermission('create_tags'), async (req, res) => {
    const { name, description, category_id, color } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Tag name is required.' });
    }

    try {
        // Check if tag already exists
        const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', name.toLowerCase())
            .single();

        if (existingTag) {
            return res.status(409).json({ error: 'Tag already exists.' });
        }

        const { data, error } = await supabase
            .from('tags')
            .insert({
                name: name.toLowerCase(),
                display_name: name,
                description,
                category_id,
                color,
                created_by: userId,
                usage_count: 0
            })
            .select(`
                *,
                tag_category:category_id(id, name, color)
            `)
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Failed to create tag:', error);
        res.status(500).json({ error: 'Could not create tag.' });
    }
});

// PUT /api/tags/:id - Update a tag
router.put('/:id', authMiddleware, checkPermission('manage_tags'), async (req, res) => {
    const { id } = req.params;
    const { display_name, description, category_id, color } = req.body;

    try {
        const updateData = {};
        
        if (display_name) {
            updateData.display_name = display_name;
            updateData.name = display_name.toLowerCase();
        }
        if (description !== undefined) updateData.description = description;
        if (category_id !== undefined) updateData.category_id = category_id;
        if (color !== undefined) updateData.color = color;

        const { data, error } = await supabase
            .from('tags')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                tag_category:category_id(id, name, color)
            `)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Tag not found.' });

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to update tag:', error);
        res.status(500).json({ error: 'Could not update tag.' });
    }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', authMiddleware, checkPermission('manage_tags'), async (req, res) => {
    const { id } = req.params;

    try {
        // First remove all image-tag associations
        await supabase
            .from('image_tags')
            .delete()
            .eq('tag_id', id);

        // Then delete the tag
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete tag:', error);
        res.status(500).json({ error: 'Could not delete tag.' });
    }
});

// POST /api/tags/bulk-create - Create multiple tags at once
router.post('/bulk-create', authMiddleware, checkPermission('create_tags'), async (req, res) => {
    const { tags } = req.body; // Array of tag names
    const userId = req.user.id;

    if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Tags array is required.' });
    }

    try {
        // Get existing tags to avoid duplicates
        const tagNames = tags.map(tag => tag.toLowerCase());
        const { data: existingTags } = await supabase
            .from('tags')
            .select('name')
            .in('name', tagNames);

        const existingTagNames = existingTags.map(tag => tag.name);
        
        // Filter out existing tags
        const newTags = tags
            .filter(tag => !existingTagNames.includes(tag.toLowerCase()))
            .map(tag => ({
                name: tag.toLowerCase(),
                display_name: tag,
                created_by: userId,
                usage_count: 0
            }));

        if (newTags.length === 0) {
            return res.status(200).json({ 
                message: 'All tags already exist.',
                created: [],
                existing: existingTags
            });
        }

        const { data, error } = await supabase
            .from('tags')
            .insert(newTags)
            .select();

        if (error) throw error;

        res.status(201).json({
            created: data,
            existing: existingTags,
            message: `Created ${data.length} new tags.`
        });
    } catch (error) {
        console.error('Bulk tag creation failed:', error);
        res.status(500).json({ error: 'Could not create tags.' });
    }
});

export default router;