// This function will be shared by multiple components
export const getImageTags = (image) => {
  // First try relational tags (new system with nested objects)
  if (image.image_tags && Array.isArray(image.image_tags)) {
    return image.image_tags
      .map(imageTag => imageTag.tags?.display_name || imageTag.tags?.name)
      .filter(Boolean);
  }
  
  // Fallback to a simple array of strings
  if (image.tags && Array.isArray(image.tags)) {
    return image.tags;
  }
  
  return []; // Return an empty array if no tags are found
};