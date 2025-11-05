import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addWatermark } from '../utils/canvasUtils';
import type { Garment } from '../types';

interface AIEditProps {
  wardrobe?: Garment[];
  onError?: (error: string) => void;
}

const AIEdit: React.FC<AIEditProps> = ({ wardrobe = [], onError }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeWardrobe = wardrobe ?? [];
  const uniqueColors = Array.from(
    new Set(safeWardrobe.map(item => item.color).filter(Boolean))
  );
  const uniqueMaterials = Array.from(
    new Set(safeWardrobe.map(item => item.material).filter(Boolean))
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        onError?.('❌ File is too large. Please upload an image under 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImage(result);
        setEditedImage(null);
      };
      reader.onerror = () => onError?.('❌ Failed to read the image file.');
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!originalImage) {
      onError?.('❌ Please upload an image first.');
      return;
    }

    if (!userInput.trim()) {
      onError?.('❌ Please describe what changes you want to make to your outfit');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX 1: Use REACT_APP env variable instead of VITE
      const apiKey = process.env.REACT_APP_GEMINI_IMAGE_API;
      if (!apiKey) {
        throw new Error('❌ Gemini API key not configured. Please add REACT_APP_GEMINI_IMAGE_API to .env.local');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // ✅ FIX 2: Use gemini-2.0-flash for better image generation
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
      
      const base64Image = originalImage.split(',')[1];

      // ✅ FIX 3: Improved prompt for better clothing editing
      const prompt = `You are an expert fashion image editor specializing in AI-powered virtual try-on and outfit styling.

IMPORTANT INSTRUCTIONS:
1. The user provides a REAL photo of themselves wearing clothes
2. They want you to EDIT the clothing in the image based on their specific request
3. You must ONLY modify the clothing as requested - do NOT change the person's body, face, or pose
4. The edited clothing must look REALISTIC and properly fitted on the person
5. Maintain consistent lighting, shadows, and colors with the original photo
6. Make sure the clothing changes blend naturally with the rest of the image

USER'S CLOTHING EDIT REQUEST: "${userInput}"

IMPORTANT: Return ONLY the edited image. Do NOT include any text, explanations, or descriptions. The output must be a valid image.`;

      const response = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ]);

      const result = await response.response;
      
      // ✅ FIX 4: Better response handling
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          
          // Handle different response types
          if ('inlineData' in part && part.inlineData) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            setEditedImage(`data:${mimeType};base64,${imageData}`);
          } else if ('text' in part) {
            // If it's text with image data
            const text = part.text as string;
            if (text.includes('data:image')) {
              setEditedImage(text);
            } else {
              throw new Error('Generated content is not an image. Please try a different prompt.');
            }
          }
        } else {
          throw new Error('No content received from API');
        }
      } else {
        throw new Error('No candidates in API response');
      }

      onError?.('✅ Image editing complete!');
    } catch (e) {
      console.error('AIEdit Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate image';
      onError?.(`❌ ${errorMessage}. Please try again with a clearer description.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!editedImage || isActionLoading) return;
    setIsActionLoading(true);

    try {
      const watermarkedImage = await addWatermark(editedImage);
      const link = document.createElement('a');
      link.href = watermarkedImage;
      link.download = `fitfx-aiedit-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onError?.('✅ Image downloaded successfully!');
    } catch (e) {
      console.error(e);
      onError?.('❌ Failed to process image for download.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePreview = (image: string) => {
    setPreviewImage(image);
  };

  return (
    <div className="space-y-6">
      {/* Wardrobe Reference */}
      {safeWardrobe.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-yellow-400 text-lg font-bold mb-4 text-center">📦 Your Wardrobe Reference ({safeWardrobe.length} items)</h3>
          <p className="text-gray-400 text-sm mb-4 text-center">💡 Here are the colors and materials you already own. Use them as inspiration!</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {safeWardrobe.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 aspect-square"
                onClick={() => handlePreview(item.image)}
              >
                <img
                  src={item.image}
                  alt={`${item.color} ${item.material}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent p-2">
                  <p className="text-xs text-yellow-400 font-semibold truncate">{item.color}</p>
                  <p className="text-xs text-gray-400 truncate">{item.material}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded p-3">
              <p className="text-xs text-gray-400">Available Colors:</p>
              <p className="text-sm text-yellow-400 font-semibold">{uniqueColors.join(', ') || 'None'}</p>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-xs text-gray-400">Available Materials:</p>
              <p className="text-sm text-yellow-400 font-semibold">{uniqueMaterials.join(', ') || 'None'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Editor UI */}
      {originalImage ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Image</label>
              <img src={originalImage} alt="Original" className="rounded-lg w-full h-auto object-contain max-h-80" />
            </div>
            <div className="bg-gray-900/50 rounded-lg flex items-center justify-center flex-col p-4">
              {loading ? (
                <div className="text-center space-y-2">
                  <div className="inline-block animate-spin text-4xl">🔄</div>
                  <p className="text-gray-400 font-semibold">Editing your image...</p>
                  <p className="text-gray-500 text-sm">(This may take 30-60 seconds)</p>
                </div>
              ) : editedImage ? (
                <>
                  <img src={editedImage} alt="Generated result" className="rounded-lg w-full h-auto object-contain max-h-80" />
                  <button
                    onClick={handleDownload}
                    disabled={isActionLoading}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all hover:bg-yellow-400 hover:text-gray-900 disabled:opacity-50"
                  >
                    ⬇️ {isActionLoading ? 'Downloading...' : 'Download'}
                  </button>
                </>
              ) : (
                <p className="text-gray-500">Your edited image will appear here</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-300 font-semibold text-sm">✍️ Describe your outfit changes:</label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Example: Change my t-shirt to blue. Add a black leather jacket. Make my pants look more formal."
              className="w-full h-24 bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-400">💡 Be specific about colors, styles, and materials for best results</p>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setOriginalImage(null);
                setEditedImage(null);
                setUserInput('');
              }}
              className="text-sm text-yellow-400 hover:underline"
            >
              ↻ Upload a different image
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
          <button
            onClick={handleUploadClick}
            className="inline-flex items-center justify-center px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all hover:bg-yellow-400 hover:text-gray-900"
          >
            📸 Choose Photo
          </button>
          <p className="text-gray-400 text-sm mt-3">Upload a clear photo of yourself wearing clothes</p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />

      {/* Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="relative max-w-2xl w-full">
            <img src={previewImage} alt="Preview" className="w-full max-h-96 rounded-lg" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-8 right-0 text-white hover:text-yellow-400 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !originalImage}
        className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {loading ? '🔄 Processing your edit...' : '🎨 Generate Image'}
      </button>
    </div>
  );
};

export default AIEdit;
