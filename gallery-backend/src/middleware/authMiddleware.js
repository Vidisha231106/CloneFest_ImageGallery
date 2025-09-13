// src/middleware/authMiddleware.js
import { supabase } from '../supabaseClient.js';

const authMiddleware = async (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided or invalid format.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the Supabase Auth token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token.');
    }

    // Get the user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found for ID:', user.id, profileError);
      throw new Error('User profile not found.');
    }

    // Debug logging
    console.log('Auth Debug:', {
      authUserId: user.id,
      profileUserId: userProfile.id,
      userRole: userProfile.role,
      userEmail: user.email
    });

    // Attach the user object with proper structure
    req.user = {
      id: user.id,                    // Use Supabase auth ID as primary
      email: user.email,
      username: userProfile.username,
      role: userProfile.role || 'user', // Default to 'user' if no role set
      avatar_url: userProfile.avatar_url,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    };
    
    // Additional debug
    console.log('Final req.user:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });
    
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed: ' + error.message });
  }
};

export default authMiddleware;