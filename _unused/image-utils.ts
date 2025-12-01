// Utility functions for image management
export const saveImageToGallery = (base64: string, name: string) => {
  try {
    const stored = localStorage.getItem("streaming-type-images");
    const images: any[] = stored ? JSON.parse(stored) : [];

    const newImage = {
      id: Date.now().toString(),
      name,
      data: base64,
      createdAt: new Date().toISOString(),
      size: Math.round((base64.length * 0.75) / 1024),
    };

    images.push(newImage);
    localStorage.setItem("streaming-type-images", JSON.stringify(images));
    return true;
  } catch (error) {
    //console.error('Error saving image:', error)
    return false;
  }
};

export const getImagesFromGallery = () => {
  try {
    const stored = localStorage.getItem("streaming-type-images");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    //console.error('Error loading images:', error)
    return [];
  }
};
