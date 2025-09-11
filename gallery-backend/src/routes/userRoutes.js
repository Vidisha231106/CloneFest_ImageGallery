// src/routes/userRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware.js';
import { supabase } from '../supabaseClient.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with default 'visitor' role
        const { data, error } = await supabase
            .from('users')
            .insert({
                email,
                username,
                password_hash: hashedPassword,
                role: 'visitor',
                is_active: true
            })
            .select('id, email, username, role, is_active')
            .single();

        if (error) throw error;

        // Generate JWT token
        const token = jwt.sign(
            { id: data.id, email: data.email, role: data.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: data,
            token
        });

    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Get user with password hash
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password hash from response
        delete user.password_hash;

        res.status(200).json({
            user,
            token
        });

    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    res.status(200).json(req.user);
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
    const { username, bio, avatar_url } = req.body;
    const userId = req.user.id;

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ username, bio, avatar_url })
            .eq('id', userId)
            .select('id, email, username, bio, avatar_url, role, is_active')
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Profile update failed:', error);
        res.status(500).json({ error: 'Profile update failed.' });
    }
});

// Admin only: Get all users
router.get('/', authMiddleware, checkPermission('manage_users'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, username, role, is_active, created_at, last_login')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// Admin only: Update user role
router.put('/:userId/role', authMiddleware, checkPermission('manage_users'), async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'editor', 'visitor'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId)
            .select('id, email, username, role, is_active')
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Role update failed:', error);
        res.status(500).json({ error: 'Role update failed.' });
    }
});

// Admin only: Deactivate/activate user
router.put('/:userId/status', authMiddleware, checkPermission('manage_users'), async (req, res) => {
    const { userId } = req.params;
    const { is_active } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('id', userId)
            .select('id, email, username, role, is_active')
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Status update failed:', error);
        res.status(500).json({ error: 'Status update failed.' });
    }
});

export default router;