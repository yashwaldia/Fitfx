import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Garment } from '../types';

interface ImageEditorProps {
  wardrobe: Garment[];
}

const ImageEditor: React.FC<ImageEditorProps> = ({ wardrobe }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const uniqueColors = Array.from(new Set(wardrobe.map(item => item.color)));
  const uniqueMaterials = Array.from(new Set(wardrobe.map(item => item.material)));

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

    if (selectedColors.length === 0 && selectedMaterials.length === 0) {
      setError('Please select at least one color or material');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY
      );
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const base64Image = originalImage.split(',')[1];

      const prompt = `You are an expert fashion image editor. Please analyze this clothing item image and:

1. If the user wants to change colors from [${selectedColors.join(', ')}], edit the image to show the item in these colors
2. If the user wants to change materials to [${selectedMaterials.join(', ')}], edit the image to reflect these material properties
3. Keep the garment style and fit exactly the same
4. Make natural, realistic changes that look professional

Return ONLY the edited image as a visual output. Make the changes look realistic and professional.`;

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

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleMaterialToggle = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
  };

  const handlePreview = (image: string) => {
    setPreviewImage(image);
  };

  return (
    <div>
      {/* Wardrobe Items Grid - EXACT SAME SIZE AS WARDROBE PAGE */}
      {wardrobe.length > 0 && (
        <div>
          <h2 className="text-center text-yellow-400 text-xl font-bold mb-4">
            Your Wardrobe ({wardrobe.length} items)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wardrobe.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 aspect-square"
                onClick={() => handlePreview(item.image)}
              >
                <img
                  src={item.image}
                  alt={`${item.color} ${item.material}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Color and Material Labels */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
                  <p className="text-sm text-yellow-400 font-semibold">
                    {item.color}
                  </p>
                  <p className="text-xs text-gray-400">{item.material}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original AI Image Editor - KEPT EXACTLY SAME */}
      <div className="bg-gray-900 rounded-lg p-6 text-center space-y-4">
        <h2 className="text-yellow-400 text-xl font-bold">AI Image Editor</h2>
        <p className="text-gray-400 text-sm">
          ⚠️ Free tier has daily limits. If you see a quota error, please wait
          a few minutes.
        </p>

        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="imageUpload"
          />
          <label htmlFor="imageUpload" className="cursor-pointer">
            <div className="text-gray-500 text-center">
              {!originalImage && <p>Choose Photo</p>}
            </div>
          </label>
        </div>

        {originalImage && (
          <div>
            <img src={originalImage} alt="original" className="max-h-96 mx-auto rounded-lg" />
          </div>
        )}

        {uniqueColors.length > 0 && (
          <div className="text-left space-y-2">
            <p className="text-gray-300 text-sm">Colors in your wardrobe:</p>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedColors.includes(color)
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {uniqueMaterials.length > 0 && (
          <div className="text-left space-y-2">
            <p className="text-gray-300 text-sm">Cloths Materials:</p>
            <div className="flex flex-wrap gap-2">
              {uniqueMaterials.map((material) => (
                <button
                  key={material}
                  onClick={() => handleMaterialToggle(material)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedMaterials.includes(material)
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleProcessImage}
          disabled={loading || !originalImage}
          className="bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed w-full"
        >
          {loading ? 'Processing...' : 'Edit Image'}
        </button>

        {editedImage && (
          <div>
            <p className="text-gray-400 text-sm mb-2">Your edit will appear here</p>
            <img src={editedImage} alt="edited" className="max-h-96 mx-auto rounded-lg" />
          </div>
        )}

        {wardrobe.length === 0 && (
          <p className="text-gray-400 text-sm">
            📦 No wardrobe items yet. Add items in "My Wardrobe" to see them here!
          </p>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div className="relative max-w-2xl">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-96 rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-8 right-0 text-white hover:text-yellow-400"
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
