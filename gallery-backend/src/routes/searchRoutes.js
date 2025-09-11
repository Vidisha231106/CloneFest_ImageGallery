// src/routes/searchRoutes.js
import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';
import { generateEmbeddingForText, generateEmbeddingForImage } from '../embeddingService.js';
import { canAccessImage } from '../middleware/permissionMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/search - Enhanced text-based search with filters
router.get('/', async (req, res) => {
    const {
        q,              // Search query
        tags,           // Comma-separated tag names
        category_id,    // Tag category filter
        privacy,        // Privacy filter (public, unlisted, private)
        user_id,        // Filter by user
        album_id,       // Filter by album
        camera_make,    // Filter by camera make
        camera_model,   // Filter by camera model
        date_from,      // Date range start (YYYY-MM-DD)
        date_to,        // Date range end (YYYY-MM-DD)
        license,        // License filter
        sort_by,        // Sort by: relevance, date, title, views
        sort_order,     // asc or desc
        page,           // Page number (default: 1)
        limit           // Results per page (default: 20, max: 100)
    } = req.query;

    try {
        // Parse pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * limitNum;

        // Start building the query
        let query = supabase
            .from('images')
            .select(`
                *,
                users!images_user_id_fkey(username, avatar_url),
                image_tags!inner(
                    tags!inner(
                        id, name, display_name, color,
                        tag_category:category_id(id, name, color)
                    )
                )
            `, { count: 'exact' });

        // Apply privacy filters based on user permissions
        if (req.user) {
            if (req.user.role === 'admin') {
                // Admins can see everything, no privacy filter needed
            } else {
                // Regular users can see public, unlisted (if editor+), and their own images
                const privacyConditions = ['public'];
                if (['admin', 'editor'].includes(req.user.role)) {
                    privacyConditions.push('unlisted');
                }
                
                query = query.or(
                    `privacy.in.(${privacyConditions.join(',')}),user_id.eq.${req.user.id}`
                );
            }
        } else {
            // Non-authenticated users can only see public images
            query = query.eq('privacy', 'public');
        }

        // Text search across multiple fields
        if (q && q.trim()) {
            const searchTerm = q.trim();
            query = query.or(`
                title.ilike.%${searchTerm}%,
                caption.ilike.%${searchTerm}%,
                alt_text.ilike.%${searchTerm}%,
                tags.ilike.%${searchTerm}%
            `);
        }

        // Tag filters
        if (tags) {
            const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
            // This requires a more complex query - we'll handle it differently
            const { data: taggedImages } = await supabase
                .from('image_tags')
                .select('image_id')
                .in('tag_id', 
                    await supabase
                        .from('tags')
                        .select('id')
                        .in('name', tagList)
                        .then(result => result.data?.map(t => t.id) || [])
                );
            
            if (taggedImages && taggedImages.length > 0) {
                const imageIds = taggedImages.map(t => t.image_id);
                query = query.in('id', imageIds);
            } else {
                // No matching tags found, return empty result
                return res.status(200).json({
                    results: [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: 0,
                        total_pages: 0
                    }
                });
            }
        }

        // Category filter (requires tag relationship)
        if (category_id) {
            const { data: categoryTags } = await supabase
                .from('tags')
                .select('id')
                .eq('category_id', category_id);
            
            if (categoryTags && categoryTags.length > 0) {
                const { data: categoryImages } = await supabase
                    .from('image_tags')
                    .select('image_id')
                    .in('tag_id', categoryTags.map(t => t.id));
                
                if (categoryImages && categoryImages.length > 0) {
                    const imageIds = categoryImages.map(t => t.image_id);
                    query = query.in('id', imageIds);
                }
            }
        }

        // User filter
        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        // Album filter
        if (album_id) {
            const { data: albumImages } = await supabase
                .from('album_images')
                .select('image_id')
                .eq('album_id', album_id);
            
            if (albumImages && albumImages.length > 0) {
                const imageIds = albumImages.map(ai => ai.image_id);
                query = query.in('id', imageIds);
            }
        }

        // Camera filters
        if (camera_make) {
            query = query.ilike('camera_make', `%${camera_make}%`);
        }
        if (camera_model) {
            query = query.ilike('camera_model', `%${camera_model}%`);
        }

        // Date range filter
        if (date_from) {
            query = query.gte('created_at', date_from);
        }
        if (date_to) {
            query = query.lte('created_at', date_to + 'T23:59:59');
        }

        // License filter
        if (license) {
            query = query.eq('license', license);
        }

        // Apply sorting
        const validSortFields = ['created_at', 'title', 'views', 'updated_at'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order === 'asc' ? true : false;
        
        query = query.order(sortField, { ascending: sortDirection });

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // Calculate pagination info
        const totalPages = Math.ceil(count / limitNum);

        res.status(200).json({
            results: data || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                total_pages: totalPages,
                has_next: pageNum < totalPages,
                has_prev: pageNum > 1
            },
            filters: {
                query: q,
                tags: tags,
                category_id: category_id,
                privacy: privacy,
                user_id: user_id,
                album_id: album_id,
                camera_make: camera_make,
                camera_model: camera_model,
                date_from: date_from,
                date_to: date_to,
                license: license
            }
        });

    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).json({ error: 'Search failed.' });
    }
});

// POST /api/search/vector - Vector similarity search
router.post('/vector', upload.single('image'), async (req, res) => {
    const { type, query, limit } = req.body;
    const searchLimit = Math.min(50, Math.max(1, parseInt(limit) || 12));

    try {
        let queryVector;

        if (type === 'text') {
            if (!query) return res.status(400).json({ error: 'Text query is missing.' });
            queryVector = await generateEmbeddingForText(query);
        } else if (type === 'image') {
            if (!req.file) return res.status(400).json({ error: 'Image file is missing.' });
            queryVector = await generateEmbeddingForImage(req.file.buffer);
        } else {
            return res.status(400).json({ error: 'Invalid search type specified.' });
        }

        // Call the Supabase database function to find matches
        const { data, error } = await supabase.rpc('match_images', {
            query_embedding: queryVector,
            match_threshold: 0.70,
            match_count: searchLimit
        });

        if (error) throw error;

        // Filter results based on user permissions
        let filteredResults = [];
        if (data) {
            for (const result of data) {
                // Get full image data
                const { data: imageData } = await supabase
                    .from('images')
                    .select(`
                        *,
                        users!images_user_id_fkey(username, avatar_url)
                    `)
                    .eq('id', result.id)
                    .single();

                if (imageData && canAccessImage(req.user, imageData)) {
                    filteredResults.push({
                        ...imageData,
                        similarity: result.similarity
                    });
                }
            }
        }

        res.status(200).json({
            results: filteredResults,
            search_type: type,
            query: type === 'text' ? query : 'image_upload',
            total_matches: filteredResults.length
        });

    } catch (error) {
        console.error('Vector search failed:', error.message);
        res.status(500).json({ error: 'An error occurred during the vector search.' });
    }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
    const { q, type } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters.' });
    }

    try {
        const suggestions = [];

        if (type === 'tags' || !type) {
            // Tag suggestions
            const { data: tagSuggestions } = await supabase
                .from('tags')
                .select('name, display_name, usage_count')
                .ilike('display_name', `%${q}%`)
                .order('usage_count', { ascending: false })
                .limit(10);

            if (tagSuggestions) {
                suggestions.push(...tagSuggestions.map(tag => ({
                    type: 'tag',
                    value: tag.name,
                    display: tag.display_name,
                    count: tag.usage_count
                })));
            }
        }

        if (type === 'users' || !type) {
            // User suggestions
            const { data: userSuggestions } = await supabase
                .from('users')
                .select('id, username, avatar_url')
                .ilike('username', `%${q}%`)
                .eq('is_active', true)
                .limit(5);

            if (userSuggestions) {
                suggestions.push(...userSuggestions.map(user => ({
                    type: 'user',
                    value: user.id,
                    display: user.username,
                    avatar: user.avatar_url
                })));
            }
        }

        if (type === 'cameras' || !type) {
            // Camera suggestions
            const { data: cameraSuggestions } = await supabase
                .from('images')
                .select('camera_make, camera_model')
                .not('camera_make', 'is', null)
                .not('camera_model', 'is', null)
                .or(`camera_make.ilike.%${q}%,camera_model.ilike.%${q}%`)
                .limit(5);

            if (cameraSuggestions) {
                const uniqueCameras = [...new Set(
                    cameraSuggestions.map(cam => `${cam.camera_make} ${cam.camera_model}`)
                )];
                
                suggestions.push(...uniqueCameras.map(camera => ({
                    type: 'camera',
                    value: camera,
                    display: camera
                })));
            }
        }

        res.status(200).json({
            query: q,
            suggestions: suggestions.slice(0, 15) // Limit total suggestions
        });

    } catch (error) {
        console.error('Suggestion search failed:', error);
        res.status(500).json({ error: 'Could not fetch suggestions.' });
    }
});

// Middleware to optionally authenticate (doesn't require auth but uses it if present)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use the auth middleware
        authMiddleware(req, res, next);
    } else {
        // No auth provided, continue without user
        req.user = null;
        next();
    }
};

// Apply optional auth to search routes
router.use(optionalAuth);

export default router;