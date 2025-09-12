import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

function ImageUploader({ onImagesUploaded, theme }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFiles = (newFiles) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    const filesWithMetadata = imageFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      progress: 0,
      status: 'pending', // pending, uploading, completed, error
      title: file.name.replace(/\.[^/.]+$/, ''),
      caption: '',
      altText: '',
      tags: '' // Changed to a single string for the input field
    }));
    setFiles(prev => [...prev, ...filesWithMetadata]);
  };
  
  // ... handleDrop, handleFileSelect, removeFile, updateFileMetadata are fine
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId, field, value) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  // --- REPLACED: simulateUpload with realUpload ---
  const realUpload = (fileData) => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return reject(new Error('Authentication token not found.'));
      }

      const formData = new FormData();
      formData.append('images', fileData.file);
      formData.append('title', fileData.title);
      formData.append('caption', fileData.caption);
      formData.append('altText', fileData.altText);
      formData.append('tags', fileData.tags);
      // You can add other fields like 'privacy' here if needed
      // formData.append('privacy', 'public');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/images', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, progress, status: 'uploading' } : f
          ));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'completed' } : f
          ));
          resolve(JSON.parse(xhr.responseText));
        } else {
          setFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'error' } : f
          ));
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      };

      xhr.onerror = () => {
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'error' } : f
        ));
        reject(new Error('Network error during upload.'));
      };

      xhr.send(formData);
    });
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    try {
      // We upload files one by one, but you can change this to Promise.all
      // for concurrent uploads.
      const allUploadedImages = [];
      for (const fileData of pendingFiles) {
        const uploadedImageArray = await realUpload(fileData);
        // The backend returns an array, even for a single file.
        if (uploadedImageArray && uploadedImageArray.length > 0) {
            allUploadedImages.push(...uploadedImageArray);
        }
      }
      onImagesUploaded(allUploadedImages);
      
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'));
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  // ... rest of the component is fine (JSX)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>Upload Images</h2>
          <p style={{ color: theme.secondary }}>Add beautiful images to your gallery</p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragOver ? 'scale-102' : ''
          }`}
          style={{
            borderColor: dragOver ? theme.primary : theme.secondary + '60',
            backgroundColor: dragOver ? theme.primary + '10' : theme.background
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-12 h-12" 
                     style={{ color: dragOver ? theme.primary : theme.secondary }} />
            </div>
            <div>
              <p className="text-lg font-medium" style={{ color: theme.text }}>
                Drop images here or click to browse
              </p>
              <p style={{ color: theme.secondary }}>
                Supports JPG, PNG, GIF up to 10MB each
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
              style={{ 
                backgroundColor: theme.primary,
                color: 'white'
              }}
            >
              Choose Files
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                Files ({files.length})
              </h3>
              <button
                onClick={handleUploadAll}
                disabled={files.every(f => f.status !== 'pending')}
                className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
                style={{ 
                  backgroundColor: theme.accent,
                  color: 'white'
                }}
              >
                Upload All
              </button>
            </div>

            <div className="space-y-4">
              {files.map((fileData) => (
                <FileItem
                  key={fileData.id}
                  fileData={fileData}
                  onRemove={removeFile}
                  onUpdateMetadata={updateFileMetadata}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// FileItem component remains the same
function FileItem({ fileData, onRemove, onUpdateMetadata, theme }) {
    const [preview, setPreview] = useState(null);
    const [expanded, setExpanded] = useState(false);
  
    React.useEffect(() => {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(fileData.file);
    }, [fileData.file]);
  
    const getStatusIcon = () => {
      switch (fileData.status) {
        case 'completed':
          return <CheckCircle className="w-5 h-5" style={{ color: theme.accent }} />;
        case 'uploading':
          return <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" 
                      style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />;
        default:
          return <ImageIcon className="w-5 h-5" style={{ color: theme.secondary }} />;
      }
    };
  
    return (
      <div className="rounded-lg border p-4 transition-all duration-200"
           style={{ 
             backgroundColor: theme.background,
             borderColor: theme.secondary + '30'
           }}>
        <div className="flex items-center space-x-4">
          {/* Preview */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
               style={{ backgroundColor: theme.secondary + '20' }}>
            {preview && (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            )}
          </div>
  
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {getStatusIcon()}
              <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
                {fileData.file.name}
              </p>
            </div>
            <p className="text-sm" style={{ color: theme.secondary }}>
              {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            {/* Progress Bar */}
            {fileData.status === 'uploading' && (
              <div className="mt-2 w-full rounded-full h-2"
                   style={{ backgroundColor: theme.secondary + '30' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${fileData.progress}%`,
                    backgroundColor: theme.primary
                  }}
                />
              </div>
            )}
          </div>
  
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: theme.primary }}
            >
              {expanded ? 'Less' : 'Edit'}
            </button>
            <button
              onClick={() => onRemove(fileData.id)}
              className="p-1 hover:opacity-80 transition-opacity"
              style={{ color: theme.secondary }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
  
        {/* Metadata Form */}
        {expanded && (
          <div className="mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
               style={{ borderTop: `1px solid ${theme.secondary}30` }}>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                Title
              </label>
              <input
                type="text"
                value={fileData.title}
                onChange={(e) => onUpdateMetadata(fileData.id, 'title', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{ 
                  borderColor: theme.secondary,
                  backgroundColor: theme.background,
                  color: theme.text,
                  focusRingColor: theme.primary
                }}
                placeholder="Image title"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                Alt Text
              </label>
              <input
                type="text"
                value={fileData.altText}
                onChange={(e) => onUpdateMetadata(fileData.id, 'altText', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{ 
                  borderColor: theme.secondary,
                  backgroundColor: theme.background,
                  color: theme.text
                }}
                placeholder="Describe this image"
              />
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                Caption
              </label>
              <textarea
                value={fileData.caption}
                onChange={(e) => onUpdateMetadata(fileData.id, 'caption', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-transparent transition-all duration-200 resize-none"
                style={{ 
                  borderColor: theme.secondary,
                  backgroundColor: theme.background,
                  color: theme.text
                }}
                rows="2"
                placeholder="Write a caption for this image"
              />
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: theme.text }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={fileData.tags}
                onChange={(e) => onUpdateMetadata(fileData.id, 'tags', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{ 
                  borderColor: theme.secondary,
                  backgroundColor: theme.background,
                  color: theme.text
                }}
                placeholder="nature, landscape, sunset"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
export default ImageUploader;