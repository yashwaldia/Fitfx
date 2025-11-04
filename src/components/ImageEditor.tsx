import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Garment } from '../types';

interface ImageEditorProps {
  wardrobe?: Garment[];
}

const ImageEditor: React.FC<ImageEditorProps> = ({ wardrobe = [] }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ FIXED: Safe wardrobe access
  const safeWardrobe = wardrobe ?? [];
  const uniqueColors = Array.from(
    new Set(safeWardrobe.map(item => item.color).filter(Boolean))
  );
  const uniqueMaterials = Array.from(
    new Set(safeWardrobe.map(item => item.material).filter(Boolean))
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = async () => {
    if (!originalImage) {
      setError('Please upload an image first');
      return;
    }

    // ✅ FIXED: Validate text input instead of color/material selection
    if (!userInput.trim()) {
      setError('Please describe what changes you want to make to your outfit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const base64Image = originalImage.split(',')[1];

      // ✅ FIXED: Use user's text input for clothing modifications
      const prompt = `You are an expert fashion image editor specializing in virtual try-on. The user is providing you with a selfie and wants you to edit their clothing based on their request.

USER'S REQUEST: "${userInput}"

Please analyze this image and apply the requested clothing changes. Make sure to:
1. Keep the person's face, body shape, and pose exactly the same
2. Only modify the clothing as requested
3. Make the clothing changes look realistic and professionally edited
4. Ensure the edited clothing fits naturally on the person
5. Maintain proper colors, shadows, and lighting to match the original photo

Return ONLY the edited image. Do NOT include any text or explanations.`;

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
      if (result.candidates?.[0]?.content?.parts?.[0]) {
        const part = result.candidates[0].content.parts[0];
        if ('text' in part) {
          setEditedImage(part.text as string);
        }
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to process the image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (image: string) => {
    setPreviewImage(image);
  };

  return (
    <div className="space-y-8">
      {/* ✅ REFERENCE SECTION: Wardrobe Items (Read-Only) */}
      {safeWardrobe.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-yellow-400 text-lg font-bold mb-4" style={{ textAlign: "center" }}>
            📦 Your Wardrobe Reference ({safeWardrobe.length} items)
          </h3>
          <p className="text-gray-400 text-sm mb-4" style={{ textAlign: "center" }}>
            💡 Here are the colors and materials you already own. Use them as inspiration when describing your edits!
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {safeWardrobe.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 aspect-square"
                onClick={() => handlePreview(item.image)}
                title="Click to preview"
              >
                <img
                  src={item.image}
                  alt={`${item.color} ${item.material}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Color and Material Labels */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent p-2">
                  <p className="text-xs text-yellow-400 font-semibold truncate">
                    {item.color}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{item.material}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reference Info */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded p-3">
              <p className="text-xs text-gray-400">Available Colors:</p>
              <p className="text-sm text-yellow-400 font-semibold">
                {uniqueColors.join(', ') || 'None'}
              </p>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <p className="text-xs text-gray-400">Available Materials:</p>
              <p className="text-sm text-yellow-400 font-semibold">
                {uniqueMaterials.join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ AI IMAGE EDITOR SECTION (Main Feature) */}
      <div className="bg-gray-900 rounded-lg p-6 space-y-4 border-2 border-yellow-400/30">
        <div style={{ textAlign: "center" }}>
          <h2 className="text-yellow-400 text-2xl font-bold mb-2" >✨ AI Outfit Editor</h2>
          <p className="text-gray-400 text-sm">
            Upload a selfie and describe how you want to edit your outfit. Our AI will virtually try on the new clothes for you!
          </p>
        </div>

        {/* Image Upload */}
        <div className="border-2 border-dashed border-yellow-400/40 rounded-lg p-8 hover:border-yellow-400/70 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="imageUpload"
          />
          <label htmlFor="imageUpload" className="cursor-pointer block text-center">
            {!originalImage ? (
              <div className="space-y-2">
                <p className="text-4xl">📸</p>
                <p className="text-gray-300 font-semibold">Click to upload your photo</p>
                <p className="text-gray-500 text-sm">(JPG, PNG, or WebP)</p>
              </div>
            ) : (
              <div className="text-green-400">✓ Photo uploaded</div>
            )}
          </label>
        </div>

        {/* Original Image Preview */}
        {originalImage && (
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Your Photo:</p>
            <img src={originalImage} alt="original" className="max-h-80 mx-auto rounded-lg" />
          </div>
        )}

        {/* ✅ TEXT INPUT FOR CLOTHING CHANGES */}
        <div className="space-y-2">
          <label className="block text-gray-300 font-semibold text-sm">
            ✍️ Describe your outfit changes:
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Example: Change my t-shirt to blue. Add a black leather jacket. Change my jeans to white. Swap my shoes to red sneakers."
            className="w-full h-24 bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none resize-none"
          />
          <p className="text-gray-500 text-xs">
            💡 Tip: Be specific! E.g., "Change shirt to red", "Add a blue jacket", "Swap shoes to white"
          </p>
        </div>

        {/* ✅ EDIT BUTTON */}
        <button
          onClick={handleProcessImage}
          disabled={loading || !originalImage}
          className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {loading ? '🔄 Processing your edit...' : '🎨 Edit My Outfit'}
        </button>

        {/* Edited Image Result */}
        {editedImage && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-green-400 text-sm font-semibold">✓ Your edited outfit:</p>
            <img src={editedImage} alt="edited" className="max-h-80 mx-auto rounded-lg" />
            <button
              onClick={() => {
                setUserInput('');
                setEditedImage(null);
              }}
              className="w-full bg-gray-700 text-gray-300 font-semibold py-2 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Try Another Edit
            </button>
          </div>
        )}

        {/* Info Section */}
        {!originalImage && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 space-y-2">
            <p className="text-blue-400 font-semibold text-sm">👔 How it works:</p>
            <ul className="text-blue-300 text-xs space-y-1 ml-4">
              <li>1️⃣ Upload a clear photo of yourself</li>
              <li>2️⃣ Describe the clothing changes you want</li>
              <li>3️⃣ AI generates your virtual try-on</li>
              <li>4️⃣ See how the outfit looks on you!</li>
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">❌ {error}</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div className="relative max-w-2xl w-full">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-96 rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-8 right-0 text-white hover:text-yellow-400 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
