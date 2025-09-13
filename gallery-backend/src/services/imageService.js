// src/services/imageService.js
import sharp from 'sharp';
import ExifReader from 'exifreader';
import { supabase } from '../supabaseClient.js';
import { canModifyImage, canDeleteImage } from '../middleware/permissionMiddleware.js';


/**
 * Extract EXIF/IPTC metadata from image buffer
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<object>} - Extracted metadata
 */
export async function extractImageMetadata(imageBuffer) {
  try {
    const tags = ExifReader.load(imageBuffer);
    
    // Extract common EXIF data
    const metadata = {
      camera: {
        make: tags['Image.Make']?.description || null,
        model: tags['Image.Model']?.description || null,
        lens: tags['EXIF.LensModel']?.description || null,
      },
      settings: {
        iso: tags['EXIF.ISOSpeedRatings']?.description || null,
        aperture: tags['EXIF.FNumber']?.description || null,
        shutter_speed: tags['EXIF.ExposureTime']?.description || null,
        focal_length: tags['EXIF.FocalLength']?.description || null,
        exposure_mode: tags['EXIF.ExposureMode']?.description || null,
        white_balance: tags['EXIF.WhiteBalance']?.description || null,
      },
      image: {
        width: tags['EXIF.PixelXDimension']?.description || null,
        height: tags['EXIF.PixelYDimension']?.description || null,
        orientation: tags['Image.Orientation']?.description || null,
        color_space: tags['EXIF.ColorSpace']?.description || null,
      },
      location: {
        gps_latitude: tags['GPS.GPSLatitude']?.description || null,
        gps_longitude: tags['GPS.GPSLongitude']?.description || null,
        gps_altitude: tags['GPS.GPSAltitude']?.description || null,
      },
      timestamps: {
        date_taken: tags['EXIF.DateTime']?.description || 
                   tags['EXIF.DateTimeOriginal']?.description || null,
        date_modified: tags['Image.DateTime']?.description || null,
      },
      iptc: {
        title: tags['IPTC.ObjectName']?.description || null,
        caption: tags['IPTC.Caption/Abstract']?.description || null,
        keywords: tags['IPTC.Keywords']?.description || null,
        copyright: tags['IPTC.CopyrightNotice']?.description || null,
        creator: tags['IPTC.By-line']?.description || null,
      }
    };

    // Clean up null values
    const cleanMetadata = JSON.parse(JSON.stringify(metadata, (key, value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      return value;
    }));

    return cleanMetadata;
  } catch (error) {
    console.warn('Failed to extract EXIF data:', error.message);
    return {};
  }
}

/**
 * Generate multiple sizes for responsive images
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<object>} - Object with different sized buffers
 */
export async function generateResponsiveSizes(imageBuffer) {
  const sizes = {
    thumbnail: { width: 300, quality: 70 },
    small: { width: 600, quality: 75 },
    medium: { width: 1200, quality: 80 },
    large: { width: 1920, quality: 85 }
  };

  const responsiveImages = {};

  for (const [sizeName, config] of Object.entries(sizes)) {
    try {
      const processedBuffer = await sharp(imageBuffer)
        .resize({ width: config.width, withoutEnlargement: true })
        .webp({ quality: config.quality })
        .toBuffer();
      
      responsiveImages[sizeName] = processedBuffer;
    } catch (error) {
      console.warn(`Failed to generate ${sizeName} size:`, error.message);
    }
  }

  return responsiveImages;
}

/**
 * Upload multiple image sizes to storage
 * @param {object} responsiveImages - Object with different sized buffers
 * @param {string} baseFileName - Base filename without extension
 * @returns {Promise<object>} - Object with URLs for different sizes
 */
export async function uploadResponsiveImages(responsiveImages, baseFileName) {
  const urls = {};
  
  for (const [sizeName, buffer] of Object.entries(responsiveImages)) {
    const fileName = `${baseFileName}-${sizeName}.webp`;
    
    const { error: storageError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (storageError) {
      console.warn(`Failed to upload ${sizeName}:`, storageError.message);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    urls[sizeName] = {
      url: urlData.publicUrl,
      path: fileName
    };
  }

  return urls;
}

/**
 * Processes an image buffer, uploads it to storage, and saves its metadata to the database.
 * @param {Buffer} imageBuffer - The buffer of the image file.
 * @param {object} metadata - An object containing title, caption, userId, privacy, etc.
 * @returns {Promise<object>} - The newly created image record from the database.
 */
export async function saveImageToGallery(imageBuffer, metadata) {
  console.log('🔄 Starting image save process...');
  console.log('📊 Metadata:', JSON.stringify(metadata, null, 2));
  console.log('📦 Buffer size:', imageBuffer.length, 'bytes');
  
  const timestamp = Date.now();
  const baseFileName = `${timestamp}-${metadata.title.replace(/\s/g, '-')}`;

  try {
    // 1. Extract EXIF metadata
    console.log('🔍 Extracting EXIF metadata...');
    const exifData = await extractImageMetadata(imageBuffer);
    console.log('✅ EXIF extracted:', Object.keys(exifData).length > 0 ? 'Yes' : 'No');

    // 2. Get image dimensions
    console.log('📏 Getting image dimensions...');
    const sharpImage = sharp(imageBuffer);
    const imageInfo = await sharpImage.metadata();
    console.log('✅ Dimensions:', `${imageInfo.width}x${imageInfo.height}`);

    // 3. Generate responsive sizes
    console.log('🖼️ Generating responsive sizes...');
    const responsiveImages = await generateResponsiveSizes(imageBuffer);
    console.log('✅ Generated sizes:', Object.keys(responsiveImages));

    // 4. Upload all sizes
    console.log('☁️ Uploading to storage...');
    const responsiveUrls = await uploadResponsiveImages(responsiveImages, baseFileName);
    console.log('✅ Upload complete. URLs:', Object.keys(responsiveUrls));

    // 5. Prepare database record
    console.log('🗄️ Preparing database record...');
    const dbRecord = {
      title: metadata.title,
      caption: metadata.caption || '',
      alt_text: metadata.altText || metadata.title,
      user_id: metadata.userId,
      privacy: metadata.privacy || 'public',
      license: metadata.license || null,
      attribution: metadata.attribution || null,
      
      // Image technical data
      mime_type: 'image/webp',
      width: imageInfo.width,
      height: imageInfo.height,
      size_bytes: imageBuffer.length,
      
      // URLs for different sizes
      url: responsiveUrls.large?.url || responsiveUrls.medium?.url,
      thumbnail_url: responsiveUrls.thumbnail?.url,
      responsive_urls: responsiveUrls,
      
      // Storage paths
      storage_path: responsiveUrls.large?.path || responsiveUrls.medium?.path,
      
      // EXIF metadata
      exif_data: exifData,
      camera_make: exifData.camera?.make,
      camera_model: exifData.camera?.model,
      date_taken: exifData.timestamps?.date_taken,
      
      // AI generation metadata (if applicable)
      generation_meta: metadata.generationMeta || null,
    };

    console.log('💾 Inserting into database...');
    console.log('🔑 Record keys:', Object.keys(dbRecord));

    // 6. Insert into database
    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert(dbRecord)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    console.log('✅ Successfully saved to database with ID:', dbData.id);
    return dbData;

  } catch (error) {
    console.error('❌ Failed to save image to gallery:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Image processing failed: ${error.message}`);
  }
}
/**
 * Update image metadata and privacy settings
 * @param {string} imageId - Image ID
 * @param {object} updates - Fields to update
 * @param {object} user - User making the update
 * @returns {Promise<object>} - Updated image record
 */
export async function updateImageMetadata(imageId, updates, user) {
  try {
    // First, get the existing image to check permissions
    const { data: existingImage, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !existingImage) {
      throw new Error('Image not found');
    }

    // Check if user can modify this image
    const canModify = canModifyImage(user, existingImage);

    if (!canModify) {
      throw new Error('Insufficient permissions to modify this image');
    }

    // Prepare allowed updates
    const allowedFields = [
      'title', 'caption', 'alt_text', 'tags', 'privacy', 
      'license', 'attribution'
    ];
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    // Update the image
    const { data, error } = await supabase
      .from('images')
      .update(filteredUpdates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) throw error;

    return data;

  } catch (error) {
    console.error('Failed to update image metadata:', error);
    throw error;
  }
}

/**
 * Delete image and all its files
 * @param {string} imageId - Image ID
 * @param {object} user - User making the deletion
 * @returns {Promise<void>}
 */
export async function deleteImageFromGallery(imageId, user) {
  try {
    // Get the image data first
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw new Error('Image not found');
    }

    // Check permissions
const canDelete = canDeleteImage(user, image);

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this image');
    }

    // Delete all responsive image files
    const filesToDelete = [];
    
    // Add main storage path
    if (image.storage_path) {
      filesToDelete.push(image.storage_path);
    }

    // Add responsive image paths
    if (image.responsive_urls) {
      Object.values(image.responsive_urls).forEach(sizeData => {
        if (sizeData.path) {
          filesToDelete.push(sizeData.path);
        }
      });
    }

    // Delete files from storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove(filesToDelete);

      if (storageError) {
        console.warn('Warning: Could not delete some files from storage', storageError);
      }
    }

    // Delete the database record
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;

  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
}