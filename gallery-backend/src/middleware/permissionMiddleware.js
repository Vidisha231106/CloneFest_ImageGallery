// src/middleware/permissionMiddleware.js

// Define role permissions
const rolePermissions = {
    admin: [
        'manage_users',
        'manage_all_images',
        'manage_all_albums',
        'delete_any_image',
        'view_private_images',
        'moderate_comments',
        'manage_tags',
        'manage_categories',
        'view_analytics'
    ],
    editor: [
        'upload_images',
        'edit_own_images',
        'create_albums',
        'edit_own_albums',
        'view_unlisted_images',
        'moderate_own_comments',
        'create_tags'
    ],
    visitor: [
        'view_public_images',
        'comment_on_images',
        'like_images'
    ]
};

// Check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
    if (!userRole || !rolePermissions[userRole]) {
        return false;
    }
    return rolePermissions[userRole].includes(permission);
};

// Middleware to check permissions
export const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!hasPermission(req.user.role, requiredPermission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions.',
                required: requiredPermission 
            });
        }

        next();
    };
};

// Check if user can access specific image based on privacy settings
export const canAccessImage = async (user, image) => {
    // Public images are accessible to everyone
    if (image.privacy === 'public') {
        return true;
    }

    // If no user is logged in, they can only see public images
    if (!user) {
        return false;
    }

    // Admins can see everything
    if (user.role === 'admin') {
        return true;
    }

    // Users can see their own images regardless of privacy
    if (image.user_id === user.id) {
        return true;
    }

    // Unlisted images can be seen by editors and above
    if (image.privacy === 'unlisted' && hasPermission(user.role, 'view_unlisted_images')) {
        return true;
    }

    // Private images can only be seen by admins or the owner
    if (image.privacy === 'private') {
        return hasPermission(user.role, 'view_private_images');
    }

    return false;
};

// Check if user can modify specific image
export const canModifyImage = (user, image) => {
    if (!user) return false;
    
    // Admins can modify any image
    if (hasPermission(user.role, 'manage_all_images')) {
        return true;
    }
    
    // Users can modify their own images if they have permission
    if (image.user_id === user.id && hasPermission(user.role, 'edit_own_images')) {
        return true;
    }
    
    return false;
};

// Check if user can delete specific image
export const canDeleteImage = (user, image) => {
    if (!user) return false;
    
    // Admins can delete any image
    if (hasPermission(user.role, 'delete_any_image')) {
        return true;
    }
    
    // Users can delete their own images if they have edit permission
    if (image.user_id === user.id && hasPermission(user.role, 'edit_own_images')) {
        return true;
    }
    
    return false;
};

// Check if user can access specific album
export const canAccessAlbum = async (user, album) => {
    // Public albums are accessible to everyone
    if (album.privacy === 'public') {
        return true;
    }

    // If no user is logged in, they can only see public albums
    if (!user) {
        return false;
    }

    // Admins can see everything
    if (user.role === 'admin') {
        return true;
    }

    // Users can see their own albums regardless of privacy
    if (album.user_id === user.id) {
        return true;
    }

    // Unlisted albums can be seen by editors and above
    if (album.privacy === 'unlisted' && hasPermission(user.role, 'view_unlisted_images')) {
        return true;
    }

    return false;
};

export default {
    hasPermission,
    checkPermission,
    canAccessImage,
    canModifyImage,
    canDeleteImage,
    canAccessAlbum,
    rolePermissions
};