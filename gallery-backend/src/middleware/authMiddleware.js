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
      throw new Error('User profile not found.');
    }

    // Attach the user object to the request for other routes to use
    req.user = {
      ...user,
      ...userProfile
    };
    
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

export default authMiddleware;