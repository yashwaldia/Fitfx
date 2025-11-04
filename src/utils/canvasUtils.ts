/**
 * Adds a "FitFx" watermark to a base64 encoded image.
 * @param imageBase64 The base64 string of the image.
 * @returns A promise that resolves with the base64 string of the watermarked image.
 */
export const addWatermark = (imageBase64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle potential CORS issues if image source was a URL
        img.src = imageBase64;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                // If context fails, return the original image to not break the flow.
                console.error("Canvas 2D context is not available.");
                return resolve(imageBase64);
            }

            // 1. Draw the original image
            ctx.drawImage(img, 0, 0);

            // 2. Prepare watermark properties
            const watermarkText = 'FitFx';
            // Make font size responsive to image width, with min/max caps
            const fontSize = Math.max(16, Math.min(img.width * 0.04, 48));
            ctx.font = `700 ${fontSize}px Poppins`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; // Semi-transparent white, good for most backgrounds
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            // Add a subtle shadow for better readability on complex backgrounds
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // 3. Draw the watermark
            const padding = Math.max(10, img.width * 0.02); // Responsive padding
            ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

            // 4. Export the canvas as a new image
            const watermarkedImage = canvas.toDataURL('image/jpeg', 0.9); // 90% quality JPEG
            resolve(watermarkedImage);
        };

        img.onerror = () => {
            console.error("Failed to load image for watermarking.");
            // Reject the promise on error to be handled by the caller.
            reject(new Error("Image could not be loaded for watermarking."));
        };
    });
};

/**
 * Converts a data URL (base64) string to a File object.
 * @param dataurl The data URL string.
 * @param filename The desired filename for the resulting File object.
 * @returns A File object, or null if conversion fails.
 */
export const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    
    try {
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("Failed to convert data URL to file:", e);
        return null;
    }
};
