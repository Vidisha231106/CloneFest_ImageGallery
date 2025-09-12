// src/routes/userRoutes.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { supabase } from '../supabaseClient.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// Register new user using Supabase Auth
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    try {
        // Step 1: Use regular signup instead of admin.createUser (more reliable)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) throw authError;

        // Step 2: Create user profile - REMOVED EMAIL COLUMN
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                username,
                role: 'user'
            })
            .select()
            .single();

        if (userError) {
            console.error('Profile creation failed:', userError);
            throw new Error('Failed to create user profile: ' + userError.message);
        }

        res.status(201).json({
            user: userData,
            message: 'User created successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: error.message || 'Registration failed.' });
    }
});

// Login user using Supabase Auth
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Step 1: Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        // Step 2: Get user profile - using service role bypasses RLS
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Profile lookup failed:', profileError);
            
            // If profile doesn't exist, create it (migration case) - REMOVED EMAIL
            if (profileError.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        username: authData.user.user_metadata?.username || email.split('@')[0],
                        role: 'user'
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                
                return res.status(200).json({
                    user: newProfile,
                    session: authData.session,
                    token: authData.session.access_token
                });
            }
            
            throw profileError;
        }

        res.status(200).json({
            user: userProfile,
            session: authData.session,
            token: authData.session.access_token
        });

    } catch (error) {
        console.error('Login failed:', error);
        res.status(401).json({ error: error.message || 'Invalid credentials.' });
    }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            console.error('Profile fetch failed:', error);
            throw error;
        }

        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
    const { username, avatar_url } = req.body;

    try {
        const updates = {};
        if (username !== undefined) updates.username = username;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Profile update failed:', error);
        res.status(500).json({ error: 'Profile update failed.' });
    }
});

// Admin routes - REMOVED EMAIL FROM SELECT
router.get('/', authMiddleware, checkPermission('manage_users'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

export default router;