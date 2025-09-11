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
    // Ask Supabase to verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token.');
    }

    // Attach the user object to the request for other routes to use
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

export default authMiddleware;