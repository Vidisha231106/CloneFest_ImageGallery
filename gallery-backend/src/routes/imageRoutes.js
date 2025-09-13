// src/routes/imageRoutes.js
import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkPermission, canAccessImage, canModifyImage, canDeleteImage } from '../middleware/permissionMiddleware.js';
import {
    saveImageToGallery,
    updateImageMetadata,
    deleteImageFromGallery
} from '../services/imageService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to optionally authenticate (doesn't require auth but uses it if present)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        authMiddleware(req, res, next);
    } else {
        req.user = null;
        next();
    }
};

// GET /api/images - Get all images with privacy filtering
router.get('/', optionalAuth, async (req, res) => {
    const {
        privacy,
        user_id,
        page = 1,
        limit = 20,
        sort_by = 'created_at',
        sort_order = 'desc'
    } = req.query;

    try {
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('images')
            .select(`
    *,
    users!images_user_id_fkey(id, username, avatar_url),
    image_tags!left(
        tags!left(id, name, display_name, color)
    )
`, { count: 'exact' });

        // Apply privacy filtering
        // Apply privacy filtering
        if (req.user) {
            // If a user is logged in, strictly filter by their user ID.
            // This ensures they see ONLY their own images by default.
            query = query.or(`user_id.eq.${req.user.id},and(privacy.eq.public,user_id.neq.${req.user.id})`);
        } else {
            // If no user is logged in, show only public images.
            query = query.eq('privacy', 'public');
        }

        // Filter by user
        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        // Apply sorting
        const validSortFields = ['created_at', 'updated_at', 'title', 'views'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order === 'asc';

        query = query
            .order(sortField, { ascending: sortDirection })
            .range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        res.status(200).json({
            images: data || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                total_pages: Math.ceil(count / limitNum)
            }
        });
    } catch (error) {
        console.error('Failed to fetch images:', error);
        res.status(500).json({ error: 'Could not fetch images' });
    }
});

// GET /api/images/:id - Get single image with permission check
router.get('/:id', optionalAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const { data: image, error } = await supabase
            .from('images')
            .select(`
                *,
                users!images_user_id_fkey(id, username, avatar_url),
                image_tags!left(
                    tags(id, name, display_name, color)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error || !image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Check if user can access this image
        if (!canAccessImage(req.user, image)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Increment view count (only for non-owners to avoid inflating own stats)
        if (!req.user || req.user.id !== image.user_id) {
            await supabase
                .from('images')
                .update({ views: (image.views || 0) + 1 })
                .eq('id', id);

            image.views = (image.views || 0) + 1;
        }

        res.status(200).json(image);
    } catch (error) {
        console.error('Failed to fetch image:', error);
        res.status(500).json({ error: 'Could not fetch image' });
    }
});

// POST /api/images - Upload new images
router.post('/', authMiddleware, checkPermission('upload_images'), upload.array('images'), async (req, res) => {
    const files = req.files;
    const userId = req.user.id;
    const {
        title,
        caption,
        altText,
        tags, // This will be a JSON string
        privacy, // This will be 'public', 'private', or 'unlisted'
        license,
        attribution
    } = req.body;

    if (!files || !files.length) {
        return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Validate privacy setting
    const validPrivacyLevels = ['public', 'unlisted', 'private'];
    if (!validPrivacyLevels.includes(privacy)) {
        return res.status(400).json({ error: 'Invalid privacy setting.' });
    }

    try {
        const uploadPromises = files.map(async (file) => {
    // Parse tags - handle both JSON string and comma-separated string
    let parsedTags = [];
    if (tags) {
        try {
            // Try to parse as JSON first
            parsedTags = JSON.parse(tags);
        } catch (jsonError) {
            // If JSON parsing fails, treat as comma-separated string
            parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
    }

    const metadata = {
        title: title || file.originalname.replace(/\.[^/.]+$/, ''),
        caption: caption || '',
        altText: altText || '',
        userId: userId,
        privacy: privacy || 'private',
        license: license,
        attribution: attribution,
        tags: parsedTags
    };

    const uploadedImage = await saveImageToGallery(file.buffer, metadata);

    // If tags were provided, create tag associations
    if (metadata.tags.length > 0) {
        await createImageTags(uploadedImage.id, metadata.tags, userId);
    }

    return uploadedImage;
});

        const uploadedImages = await Promise.all(uploadPromises);
        res.status(201).json(uploadedImages);
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: 'File upload failed.' });
    }
});

// Helper function to create image-tag associations
async function createImageTags(imageId, tagNames, userId) {
    try {
        // Get or create tags
        const tagPromises = tagNames.map(async (tagName) => {
            const normalizedName = tagName.toLowerCase().trim();

            if (!normalizedName) return null; // Skip empty tags

            // Try to find existing tag
            let { data: existingTag } = await supabase
                .from('tags')
                .select('id')
                .eq('name', normalizedName)
                .single();

            if (!existingTag) {
                // Create new tag
                const { data: newTag, error } = await supabase
                    .from('tags')
                    .insert({
                        name: normalizedName,
                        display_name: tagName,
                        created_by: userId,
                        usage_count: 1 // Start with 1 since we're using it now
                    })
                    .select('id')
                    .single();

                if (!error && newTag) {
                    existingTag = newTag;
                }
            }

            return existingTag?.id;
        });

        const tagIds = (await Promise.all(tagPromises)).filter(Boolean);

        // Create image-tag associations
        if (tagIds.length > 0) {
            const imageTagData = tagIds.map(tagId => ({
                image_id: imageId,
                tag_id: tagId
            }));

            const { error } = await supabase
                .from('image_tags')
                .insert(imageTagData);

            if (error) {
                console.error('Failed to create image-tag associations:', error);
                throw error;
            }

            console.log(`Successfully created ${tagIds.length} tag associations for image ${imageId}`);
        }
    } catch (error) {
        console.error('Failed to create image tags:', error);
        throw error; // Re-throw to handle in calling function
    }
}

// PUT /api/images/:id - Update image metadata
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, caption, alt_text, privacy, license, attribution, tags } = req.body;

    try {
        // Get existing image to check permissions
        const { data: existingImage, error: fetchError } = await supabase
            .from('images')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingImage) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Check if user can modify this image
        if (!canModifyImage(req.user, existingImage)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Prepare updates
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (caption !== undefined) updates.caption = caption;
        if (alt_text !== undefined) updates.alt_text = alt_text;
        if (privacy !== undefined) {
            const validPrivacyLevels = ['public', 'unlisted', 'private'];
            if (!validPrivacyLevels.includes(privacy)) {
                return res.status(400).json({ error: 'Invalid privacy setting.' });
            }
            updates.privacy = privacy;
        }
        if (license !== undefined) updates.license = license;
        if (attribution !== undefined) updates.attribution = attribution;

        // Update image metadata
        const { data, error } = await supabase
            .from('images')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                users!images_user_id_fkey(id, username, avatar_url),
                image_tags!left(
                    tags!inner(id, name, display_name, color)
                )
            `)
            .single();

        if (error) throw error;

        // Handle tag updates if provided
        if (tags !== undefined) {
            await updateImageTags(id, tags, req.user.id);

            // Refetch image with updated tags
            const { data: updatedImage } = await supabase
                .from('images')
                .select(`
                    *,
                    users!images_user_id_fkey(id, username, avatar_url),
                    image_tags!left(
                        tags!inner(id, name, display_name, color)
                    )
                `)
                .eq('id', id)
                .single();

            return res.status(200).json(updatedImage);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to update image:', error);
        res.status(500).json({ error: 'Could not update image' });
    }
});

// Helper function to update image tags
async function updateImageTags(imageId, tagNames, userId) {
    try {
        // Remove existing tags
        await supabase
            .from('image_tags')
            .delete()
            .eq('image_id', imageId);

        // Add new tags if provided
        if (tagNames && tagNames.length > 0) {
            const tags = Array.isArray(tagNames) ? tagNames : tagNames.split(',').map(t => t.trim());
            await createImageTags(imageId, tags, userId);
        }
    } catch (error) {
        console.error('Failed to update image tags:', error);
    }
}

// POST /api/images/:id/tags - Add tags to an image
router.post('/:id/tags', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Tags array is required.' });
    }

    try {
        // Check if user can modify this image
        const { data: image, error: fetchError } = await supabase
            .from('images')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        if (!canModifyImage(req.user, image)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Add new tags (createImageTags handles duplicates)
        await createImageTags(id, tags, req.user.id);

        // Return updated image with tags
        const { data: updatedImage } = await supabase
            .from('images')
            .select(`
                *,
                image_tags!left(
                    tags!inner(id, name, display_name, color)
                )
            `)
            .eq('id', id)
            .single();

        res.status(200).json(updatedImage);
    } catch (error) {
        console.error('Failed to add tags:', error);
        res.status(500).json({ error: 'Could not add tags to image' });
    }
});

// DELETE /api/images/:id/tags/:tagId - Remove a tag from an image
router.delete('/:id/tags/:tagId', authMiddleware, async (req, res) => {
    const { id, tagId } = req.params;

    try {
        // Check if user can modify this image
        const { data: image, error: fetchError } = await supabase
            .from('images')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        if (!canModifyImage(req.user, image)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Remove the tag association
        const { error } = await supabase
            .from('image_tags')
            .delete()
            .eq('image_id', id)
            .eq('tag_id', tagId);

        if (error) throw error;

        // Update tag usage count
        const { data: tag } = await supabase
            .from('tags')
            .select('usage_count')
            .eq('id', tagId)
            .single();

        if (tag) {
            const newCount = Math.max((tag.usage_count || 0) - 1, 0);
            await supabase
                .from('tags')
                .update({ usage_count: newCount })
                .eq('id', tagId);
        }

        res.status(204).send();
    } catch (error) {
        console.error('Failed to remove tag:', error);
        res.status(500).json({ error: 'Could not remove tag from image' });
    }
});

// DELETE /api/images/:id - Delete an image
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Get the image first to check permissions
        const { data: image, error: fetchError } = await supabase
            .from('images')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Check if user can delete this image
        if (!canDeleteImage(req.user, image)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Use the service function to handle complete deletion
        await deleteImageFromGallery(id, req.user);

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete image:', error);
        res.status(500).json({ error: error.message || 'Could not delete image' });
    }
});

// POST /api/images/bulk-delete - Delete multiple images
router.post('/bulk-delete', authMiddleware, async (req, res) => {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({ error: 'Image IDs array is required.' });
    }

    try {
        const deletedCount = { success: 0, failed: 0, errors: [] };

        for (const imageId of imageIds) {
            try {
                // Get the image to check permissions
                const { data: image, error: fetchError } = await supabase
                    .from('images')
                    .select('*')
                    .eq('id', imageId)
                    .single();

                if (fetchError || !image) {
                    deletedCount.failed++;
                    deletedCount.errors.push({ imageId, error: 'Image not found' });
                    continue;
                }

                if (!canDeleteImage(req.user, image)) {
                    deletedCount.failed++;
                    deletedCount.errors.push({ imageId, error: 'Access denied' });
                    continue;
                }

                await deleteImageFromGallery(imageId, req.user);
                deletedCount.success++;

            } catch (error) {
                deletedCount.failed++;
                deletedCount.errors.push({ imageId, error: error.message });
            }
        }

        res.status(200).json({
            message: `Deleted ${deletedCount.success} images, ${deletedCount.failed} failed`,
            ...deletedCount
        });

    } catch (error) {
        console.error('Bulk delete failed:', error);
        res.status(500).json({ error: 'Bulk delete operation failed.' });
    }
});

// POST /api/images/bulk-update - Update multiple images
router.post('/bulk-update', authMiddleware, async (req, res) => {
    const { imageIds, updates } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({ error: 'Image IDs array is required.' });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Updates object is required.' });
    }

    try {
        const updateCount = { success: 0, failed: 0, errors: [] };

        for (const imageId of imageIds) {
            try {
                const { data: image, error: fetchError } = await supabase
                    .from('images')
                    .select('*')
                    .eq('id', imageId)
                    .single();

                if (fetchError || !image) {
                    updateCount.failed++;
                    updateCount.errors.push({ imageId, error: 'Image not found' });
                    continue;
                }

                if (!canModifyImage(req.user, image)) {
                    updateCount.failed++;
                    updateCount.errors.push({ imageId, error: 'Access denied' });
                    continue;
                }

                await updateImageMetadata(imageId, updates, req.user);
                updateCount.success++;

            } catch (error) {
                updateCount.failed++;
                updateCount.errors.push({ imageId, error: error.message });
            }
        }

        res.status(200).json({
            message: `Updated ${updateCount.success} images, ${updateCount.failed} failed`,
            ...updateCount
        });

    } catch (error) {
        console.error('Bulk update failed:', error);
        res.status(500).json({ error: 'Bulk update operation failed.' });
    }
});

export default router;