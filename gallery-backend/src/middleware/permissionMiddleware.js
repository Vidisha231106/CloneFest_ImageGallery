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
        'view_analytics',
        'upload_images',
        'edit_own_images',
        'create_albums',
        'edit_own_albums',
        'view_unlisted_images',
        'delete_own_images',
        'create_tags'
    ],
    editor: [
        'upload_images',
        'edit_own_images',
        'create_albums',
        'edit_own_albums',
        'view_unlisted_images',
        'moderate_own_comments',
        'delete_own_images',
        'create_tags'
    ],
    user: [ // Changed from 'visitor' to 'user' to match your schema
        'view_public_images',
        'comment_on_images',
        'like_images',
        'upload_images',
        'edit_own_images',
        'create_albums',
        'delete_own_images',
        'edit_own_albums'
    ]
};

// Check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
    if (!userRole || !rolePermissions[userRole]) {
        console.log('Permission check failed - invalid role:', { userRole, permission, availableRoles: Object.keys(rolePermissions) });
        return false;
    }
    const hasIt = rolePermissions[userRole].includes(permission);
    console.log('Permission check:', { userRole, permission, hasPermission: hasIt });
    return hasIt;
};

// Middleware to check permissions
export const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('Permission denied - no user:', requiredPermission);
            return res.status(401).json({ error: 'Authentication required.' });
        }

        console.log('Checking permission:', { 
            requiredPermission, 
            userRole: req.user.role, 
            userId: req.user.id 
        });

        if (!hasPermission(req.user.role, requiredPermission)) {
            console.log('Permission denied:', { 
                userRole: req.user.role, 
                requiredPermission,
                userPermissions: rolePermissions[req.user.role] || []
            });
            return res.status(403).json({
                error: 'Insufficient permissions.',
                required: requiredPermission,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Check if user can access specific image based on privacy settings
export const canAccessImage = (user, image) => {
    console.log('Access check:', { 
        userId: user?.id, 
        imageUserId: image?.user_id, 
        imagePrivacy: image?.privacy,
        userRole: user?.role 
    });

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
    console.log('Modify check:', { 
        userId: user?.id, 
        imageUserId: image?.user_id, 
        userRole: user?.role,
        imageId: image?.id,
        hasUser: !!user,
        hasImage: !!image
    });

    if (!user || !image) {
        console.log('Modify denied - missing user or image');
        return false;
    }
    
    // Admins can modify any image
    if (user.role === 'admin') {
        console.log('Modify allowed - admin user');
        return true;
    }
    
    // Check if user owns the image
    const ownsImage = String(image.user_id) === String(user.id);
    console.log('Ownership check:', { 
        imageUserId: image.user_id, 
        imageUserIdType: typeof image.user_id,
        userId: user.id, 
        userIdType: typeof user.id,
        ownsImage 
    });
    
    // Users can modify their own images if they have the permission
    if (ownsImage && hasPermission(user.role, 'edit_own_images')) {
        console.log('Modify allowed - owns image and has permission');
        return true;
    }
    
    console.log('Modify denied - insufficient permissions');
    return false;
};

// Check if user can delete specific image
export const canDeleteImage = (user, image) => {
    console.log('Delete check:', { 
        userId: user?.id, 
        imageUserId: image?.user_id, 
        userRole: user?.role 
    });

    if (!user) {
        console.log('Delete denied - no user');
        return false;
    }

    // Admins can delete any image
    if (hasPermission(user.role, 'delete_any_image')) {
        console.log('Delete allowed - admin permissions');
        return true;
    }

    // Check ownership and permission
    const ownsImage = String(image.user_id) === String(user.id);
    if (ownsImage && hasPermission(user.role, 'delete_own_images')) {
        console.log('Delete allowed - owns image and has permission');
        return true;
    }

    console.log('Delete denied - insufficient permissions');
    return false;
};

// Check if user can access specific album
export const canAccessAlbum = (user, album) => {
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