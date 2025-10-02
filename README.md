# 🖼️ ImageGallery - A Full-Stack Cloud Media Management Platform

ImageGallery is a modern, full-stack application for uploading, managing, and sharing images. It's built with a powerful combination of React, Node.js, and Supabase, providing a secure, scalable, and feature-rich platform for your media.

## ✨ Features

- **Secure User Authentication**: JSON Web Token-based authentication with registration, login, and session management
- **Drag-and-Drop Uploader**: An intuitive interface for uploading multiple images, complete with progress bars and status indicators
- **Advanced Metadata Editing**: Add and edit titles, captions, alt text, and tags for each image before and after uploading
- **Dynamic Image Gallery**: A responsive grid layout that displays all user-accessible images
- **Full-Screen Lightbox Viewer**: A beautiful, immersive viewer for individual images with easy navigation
- **Image Management**: Securely edit or delete your own uploaded images
- **AI Image Generation**: Generate images from text prompts using Hugging Face's Stable Diffusion XL
- **Performance Optimized**: Fast loading with thumbnail support, skeleton loading states, and optimistic UI updates
- **Real-time Collaboration**: Live updates using Supabase realtime subscriptions for seamless multi-user experience
- **Theming Engine**: A floating color palette editor to customize the application's entire look and feel in real-time
- **Role-Based Permissions**: A backend system to support different user roles (user, editor, admin)
- **Album Management**: A dedicated view for creating and organizing images into albums

## 🛠️ Tech Stack & Architecture

This project uses a decoupled, full-stack architecture. The React frontend is a standalone application that communicates with a custom Node.js backend API. The backend acts as a secure gateway and business logic layer for the Supabase BaaS (Backend-as-a-Service) platform.

### The Stack

| **Frontend** | **Backend** |
|--------------|-------------|
| Framework: React 18 (with Vite) | Environment: Node.js |
| Language: JavaScript (ES6+) & JSX | Framework: Express.js |
| Styling: Tailwind CSS | Database: Supabase (PostgreSQL) |
| Icons: Lucide React | Authentication: Supabase Auth |
| Communication: Fetch API | Storage: Supabase Storage |
| | Image Processing: sharp |
| | File Uploads: multer |
| | Metadata Extraction: exifreader |
| | AI Image Generation: Hugging Face API |
| | Real-time Updates: Supabase Realtime |

### Architecture Overview

The separation of concerns between the frontend, backend, and Supabase is a key design choice.

```
+----------------+     +---------------------+     +----------------------+
|                |     |                     |     |                      |
|     React      |     |  Node.js / Express  |     |  Supabase Platform   |
|   (Frontend)   |---->|  (Backend API)      |---->| (DB, Auth, Storage)  |
|                |     |                     |     |                      |
+----------------+     +---------------------+     +----------------------+
  (Runs in Browser)     (Your Secure Server)        (Cloud Infrastructure)
```

- **React Frontend**: Provides a dynamic and interactive user interface. It handles all rendering, state management, and user events. It never interacts with Supabase directly, except for the initial supabaseClient.js which is not used for data operations.

- **Node.js Backend API**: This is the crucial middle layer.
  - **Security**: It protects your secret Supabase keys. The frontend only ever has the public anon key, while the backend uses the powerful service_role key.
  - **Business Logic**: It handles complex operations like image processing with sharp to create thumbnails, validating user permissions, and managing tag relationships.
  - **Abstraction**: It provides clean, simple API endpoints (`/api/images`, `/api/users`) for the frontend, hiding the complexity of the underlying database operations.

- **Supabase**: Acts as the powerful and scalable data layer. It handles the PostgreSQL database, user authentication, and file storage, allowing the backend to focus on business logic.

## 🗄️ Database Schema

The application uses a PostgreSQL database hosted on Supabase with the following main tables:

- **`users`**: Stores user profiles linked to Supabase Auth, with role-based permissions
- **`images`**: Core image data including metadata, EXIF information, and file references
- **`albums`**: User-created image collections with privacy settings
- **`album_images`**: Junction table linking images to albums (many-to-many)
- **`tags`**: Hierarchical tagging system for image categorization
- **`tag_categories`**: Organized tag groups with visual styling
- **`image_tags`**: Junction table linking images to tags (many-to-many)
- **`palettes`**: User-created color themes for UI customization

The schema supports advanced features like privacy controls, EXIF metadata storage, AI generation tracking, and comprehensive tagging systems.

## 🚀 Performance Features

This application is optimized for speed and user experience:

- **Thumbnail Optimization**: Images load thumbnails in gallery view and full resolution only when needed
- **Skeleton Loading**: Smooth loading states prevent layout shifts and provide immediate feedback
- **Optimistic UI Updates**: Instant feedback for user actions like deletions before server confirmation
- **Centralized API Client**: Consistent error handling and authentication across all API calls
- **Real-time Synchronization**: Live updates when images are added, modified, or deleted by any user
- **Efficient Queries**: Optimized database queries with pagination and selective field loading

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm
- A free [Supabase](https://supabase.com) account
- A free [Hugging Face](https://huggingface.co) account for AI image generation

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Vidisha231106/CloneFest_ImageGallery.git
   ```

2. **Set up Supabase:**
   - Create a new project on [Supabase](https://supabase.com)
   - Go to **Project Settings** → **API**
   - You will need the Project URL, anon key, and service_role key
   - Go to the **SQL Editor** and run the SQL schema file to create the tables
   - Go to **Storage** and create a new public bucket named `images`

3. **Backend Setup:**
   ```bash
   # Navigate to the backend folder
   cd gallery-backend
   
   # Install NPM packages
   npm install
   
   # Create a .env file and add your credentials
   touch .env
   ```

   Your backend `.env` file should look like this:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your_secret_service_role_key_here
   HUGGINGFACE_API_TOKEN=your_huggingface_api_token_here
   ```

   ```bash
   # Start the backend server
   npm run dev
   ```

   The backend will typically run on `http://localhost:4000`.

4. **Frontend Setup:**
   ```bash
   # Navigate to the frontend folder
   cd gallery-frontend
   
   # Install NPM packages
   npm install
   ```

   In `vite.config.js`, ensure the proxy is pointing to your backend's port:
   ```javascript
   // vite.config.js
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:4000', // Make sure this matches your backend port
         changeOrigin: true,
       }
     }
   }
   ```

   ```bash
   # Start the frontend dev server
   npm run dev
   ```

   Your React application will be available at `http://localhost:5173`.

## 🌐 Deployment

This application is designed for easy deployment on modern platforms:

- **Frontend**: Optimized for Vercel, Netlify, or similar static hosting services
- **Backend**: Compatible with Railway, Render, or any Node.js hosting platform
- **Database**: Uses Supabase's cloud PostgreSQL with built-in scaling
- **Environment Configuration**: Separate environment variables for development and production

The frontend uses centralized API configuration that automatically adapts to different deployment environments.

## 👥 Contributors

ImageGallery was developed as a team effort by the following contributors:
| Name | GitHub |
|------|-------------------|
| Prapti Belekeri | [praptibelekeri](https://github.com/praptibelekeri) |
| Samanvitha L | [Samanvitha97](https://github.com/Samanvitha97) |
| Tanisha R | [Tanisha-27-12](https://github.com/Tanisha-27-12)|
| Vidisha Dewan | [Vidisha231106](https://github.com/Vidisha231106) |

Special thanks to nerdylua Nihaal SP for insightful contributions and for helping us significantly improve the codebase!
