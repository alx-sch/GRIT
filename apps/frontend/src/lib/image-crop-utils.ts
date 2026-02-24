import { Area } from 'react-easy-crop';

/**
 * Creates a cropped image from the source image and crop area
 * @param imageSrc - Source image URL or data URL
 * @param croppedAreaPixels - Pixel coordinates of the crop area from react-easy-crop
 * @param rotation - Rotation angle in degrees (0, 90, 180, 270)
 * @param outputSize - Output dimensions (defaults to 400x400 for avatars)
 * @param quality - JPEG quality (0-1, defaults to 0.9)
 * @returns Promise<File> - Cropped image as a File object
 */
export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area,
  rotation = 0,
  outputSize = { width: 400, height: 400 },
  quality = 0.9
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate rotated dimensions
  const { width: imgWidth, height: imgHeight } = image;
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = imgWidth * cos + imgHeight * sin;
  const rotatedHeight = imgWidth * sin + imgHeight * cos;

  // Set canvas size to rotated image size
  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;

  // Draw rotated image
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -imgWidth / 2, -imgHeight / 2);

  // Extract the cropped area
  const data = ctx.getImageData(
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  // Set canvas size to output size
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  // Clear and draw the cropped image scaled to output size
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, outputSize.width, outputSize.height);

  // Create temporary canvas for the cropped data
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get temporary canvas context');
  }

  tempCanvas.width = croppedAreaPixels.width;
  tempCanvas.height = croppedAreaPixels.height;
  tempCtx.putImageData(data, 0, 0);

  ctx.drawImage(tempCanvas, 0, 0, outputSize.width, outputSize.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (blob.size > maxSize) {
          reject(
            new Error(
              `Image too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB. Try reducing the zoom level.`
            )
          );
          return;
        }

        // Convert blob to File
        const file = new File([blob], 'avatar.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        resolve(file);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Creates an HTMLImageElement from a source URL
 * @param url - Image URL or data URL
 * @returns Promise<HTMLImageElement>
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => {
      resolve(image);
    });
    image.addEventListener('error', (error) => {
      reject(new Error(`Failed to load image: ${error.type}`));
    });
    image.setAttribute('crossOrigin', 'anonymous'); // Handle CORS
    image.src = url;
  });
}

/**
 * Reads a File object and returns a data URL
 * @param file - File object to read
 * @returns Promise<string> - Data URL of the file
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

/**
 * Validates image file before processing
 * @param file - File to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please select a valid image file.',
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Image too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Gets the actual image dimensions from a File
 * @param file - Image file
 * @returns Promise<{width: number, height: number}>
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const dataUrl = await readFileAsDataURL(file);
  const image = await createImage(dataUrl);
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}
