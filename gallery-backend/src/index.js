// src/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import imageRoutes from './routes/imageRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import generateRoutes from './routes/generateRoutes.js';
import paletteRoutes from './routes/paletteRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({
  origin: 'https://clonefestimagegalleryfrontend-production.up.railway.app',
  credentials: true
}));
// --- Middleware ---
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Security Headers ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// --- API Routes ---
// Health check route
app.get('/', (req, res) => {
    res.json({
        message: 'Image Gallery API',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API route registration
app.use('/api/users', userRoutes);           // User management and auth
app.use('/api/images', imageRoutes);         // Image CRUD with privacy
app.use('/api/albums', albumRoutes);         // Album management
app.use('/api/tags', tagRoutes);             // Tag management
app.use('/api/categories', categoryRoutes);  // Tag categories
app.use('/api/search', searchRoutes);        // Enhanced search
app.use('/api/generate', generateRoutes);    // AI generation
app.use('/api/palettes', paletteRoutes);     // Color palettes

// --- Error Handling Middleware ---
// Handle 404 - Not Found
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Image Gallery API is running on http://localhost:${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${frontendURL}`);
    console.log(`📊 Available routes:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /api/users/register - User registration`);
    console.log(`   POST /api/users/login - User login`);
    console.log(`   GET  /api/images - List images`);
    console.log(`   POST /api/images - Upload images`);
    console.log(`   GET  /api/search - Enhanced search`);
    console.log(`   POST /api/search/vector - Vector similarity search`);
    console.log(`   GET  /api/tags - List tags`);
    console.log(`   GET  /api/categories - List categories`);
    console.log(`   GET  /api/albums - List albums`);
    console.log(`   POST /api/generate - AI image generation`);
});