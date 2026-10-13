/**
 * Utility to compress and resize images on the client before saving.
 * Reduces 5MB-10MB camera/phone photos to ~50KB crisp poster images
 * that fit effortlessly within browser storage limits.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 720,
  maxHeight = 1080,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error("Failed to read image file."));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while fitting within maxWidth and maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized JPEG
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => resolve(src);
      img.src = src;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
