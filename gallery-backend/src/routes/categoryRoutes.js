// src/routes/categoryRoutes.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// GET /api/categories - Get all categories with tag counts
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tag_categories')
            .select(`
                *,
                tags(count)
            `)
            .order('name', { ascending: true });

        if (error) throw error;

        // Add tag counts to each category
        const categoriesWithCounts = data.map(category => ({
            ...category,
            tag_count: category.tags?.length || 0
        }));

        res.status(200).json(categoriesWithCounts);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({ error: 'Could not fetch categories.' });
    }
});

// GET /api/categories/:id - Get single category with its tags
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('tag_categories')
            .select(`
                *,
                tags(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Category not found.' });

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to fetch category:', error);
        res.status(500).json({ error: 'Could not fetch category.' });
    }
});

// POST /api/categories - Create a new category
router.post('/', authMiddleware, checkPermission('manage_tags'), async (req, res) => {
    const { name, description, color, icon } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    try {
        // Check if category already exists
        const { data: existingCategory } = await supabase
            .from('tag_categories')
            .select('id')
            .eq('name', name)
            .single();

        if (existingCategory) {
            return res.status(409).json({ error: 'Category already exists.' });
        }

        const { data, error } = await supabase
            .from('tag_categories')
            .insert({
                name,
                description,
                color: color || '#6b7280', // Default gray color
                icon,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Failed to create category:', error);
        res.status(500).json({ error: 'Could not create category.' });
    }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', authMiddleware, checkPermission('manage_tags'), async (req, res) => {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (icon !== undefined) updateData.icon = icon;

        const { data, error } = await supabase
            .from('tag_categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Category not found.' });

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to update category:', error);
        res.status(500).json({ error: 'Could not update category.' });
    }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', authMiddleware, checkPermission('manage_tags'), async (req, res) => {
    const { id } = req.params;

    try {
        // Check if category has tags
        const { data: tags, error: tagError } = await supabase
            .from('tags')
            .select('id')
            .eq('category_id', id);

        if (tagError) throw tagError;

        if (tags && tags.length > 0) {
            // Update tags to remove category reference instead of deleting
            await supabase
                .from('tags')
                .update({ category_id: null })
                .eq('category_id', id);
        }

        // Delete the category
        const { error } = await supabase
            .from('tag_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete category:', error);
        res.status(500).json({ error: 'Could not delete category.' });
    }
});

export default router;