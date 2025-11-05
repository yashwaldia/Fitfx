import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addWatermark } from '../utils/canvasUtils';

interface AIFabricMixerProps {
  onError?: (error: string) => void;
}

const AIFabricMixer: React.FC<AIFabricMixerProps> = ({ onError }) => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [clothingPart, setClothingPart] = useState<'top' | 'bottom'>('top');
  const [loading, setLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraTarget, setCameraTarget] = useState<'person' | 'fabric' | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'person' | 'fabric'>('person');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        onError?.('❌ File is too large. Please upload an image under 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (uploadTarget === 'person') {
          setPersonImage(reader.result as string);
        } else {
          setFabricImage(reader.result as string);
        }
        setEditedImage(null);
      };
      reader.onerror = () => onError?.('❌ Failed to read the image file.');
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = (target: 'person' | 'fabric') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const startCamera = async (target: 'person' | 'fabric') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        setCameraTarget(target);
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      onError?.('❌ Could not access camera. Please ensure you have given permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraTarget(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (cameraTarget === 'person') {
          setPersonImage(dataUrl);
        } else {
          setFabricImage(dataUrl);
        }
        setEditedImage(null);
      }
      stopCamera();
    }
  };

  const handleGenerate = async () => {
    if (!personImage) {
      onError?.('❌ Please provide a photo of yourself.');
      return;
    }
    if (!fabricImage) {
      onError?.('❌ Please provide a photo of the fabric.');
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
      
      const base64Image1 = personImage.split(',')[1];
      const base64Image2 = fabricImage.split(',')[1];

      // ✅ FIX 3: Improved prompt for fabric mixing
      const generationPrompt = `You are an expert AI fashion designer specializing in virtual fabric try-on.

TASK: Analyze the person in the first image and the fabric/pattern in the second image. 
Create a new image showing the person wearing clothing made from the fabric in the second image.

KEY INSTRUCTIONS:
1. Generate ONLY the ${clothingPart} portion of the outfit using the fabric pattern/texture from image 2
2. The fit, style, and design of the clothing should remain similar to the original
3. The fabric's color, texture, and pattern should be clearly visible and realistic
4. MUST preserve: The person's face, body shape, pose, hair, and all other clothing items
5. MUST preserve: The background and overall composition of the original photo
6. Ensure the fabric blends naturally with proper shadows and lighting
7. The clothing should look professionally tailored and realistic

Important: Output ONLY the edited image. Do NOT include any text, explanations, or descriptions.`;

      const response = await model.generateContent([
        {
          inlineData: {
            data: base64Image1,
            mimeType: 'image/jpeg',
          },
        },
        {
          inlineData: {
            data: base64Image2,
            mimeType: 'image/jpeg',
          },
        },
        generationPrompt,
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
            const text = part.text as string;
            if (text.includes('data:image')) {
              setEditedImage(text);
            } else {
              throw new Error('Generated content is not an image. Please try again.');
            }
          }
        } else {
          throw new Error('No content received from API');
        }
      } else {
        throw new Error('No candidates in API response');
      }

      onError?.('✅ Fabric mixing complete!');
    } catch (e) {
      console.error('AIFabricMixer Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate image';
      onError?.(`❌ ${errorMessage} Please try again.`);
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
      link.download = `fitfx-fabricmix-${new Date().getTime()}.jpg`;
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

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-gray-400">✨ Virtually try on any fabric. Upload a photo of yourself and a photo of the fabric pattern.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Person Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 text-center">1. Your Photo</h3>
          <div className="w-full aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
            {personImage ? (
              <img src={personImage} alt="Person" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <p className="text-gray-500 text-4xl">👤</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleUploadClick('person')}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900 transition-all"
            >
              📤 Upload
            </button>
            <button
              onClick={() => startCamera('person')}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900 transition-all"
            >
              📷 Photo
            </button>
          </div>
        </div>

        {/* Fabric Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 text-center">2. Fabric Photo</h3>
          <div className="w-full aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
            {fabricImage ? (
              <img src={fabricImage} alt="Fabric" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <p className="text-gray-500 text-4xl">🧵</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleUploadClick('fabric')}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900 transition-all"
            >
              📤 Upload
            </button>
            <button
              onClick={() => startCamera('fabric')}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900 transition-all"
            >
              📷 Photo
            </button>
          </div>
        </div>
      </div>

      {/* Clothing Part Selection */}
      <div>
        <h3 className="text-lg font-semibold text-yellow-400 text-center mb-3">3. Apply Fabric To</h3>
        <div className="flex justify-center p-1 bg-gray-900 rounded-full max-w-xs mx-auto border border-gray-700">
          <button
            onClick={() => setClothingPart('top')}
            className={`w-full px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              clothingPart === 'top' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            👕 Top
          </button>
          <button
            onClick={() => setClothingPart('bottom')}
            className={`w-full px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              clothingPart === 'bottom' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            👖 Bottom
          </button>
        </div>
      </div>

      {/* Result */}
      <div>
        <h3 className="text-lg font-semibold text-yellow-400 text-center mb-4">4. Your Fabric Mix Result</h3>
        <div className="bg-gray-900/50 rounded-lg flex items-center justify-center flex-col p-4 w-full aspect-square border border-gray-700">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin text-4xl">🔄</div>
              <p className="text-gray-400 font-semibold">Mixing fabric...</p>
              <p className="text-gray-500 text-sm">(This may take 30-60 seconds)</p>
            </div>
          ) : editedImage ? (
            <>
              <img src={editedImage} alt="Generated result" className="rounded-lg w-full h-full object-contain" />
              <button
                onClick={handleDownload}
                disabled={isActionLoading}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all hover:bg-yellow-400 hover:text-gray-900 disabled:opacity-50"
              >
                ⬇️ {isActionLoading ? 'Downloading...' : 'Download'}
              </button>
            </>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-lg">✨ Your fabric mix will appear here</p>
              <p className="text-gray-400 text-xs">Upload both images and select fabric part to begin</p>
            </div>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
      <canvas ref={canvasRef} className="hidden"></canvas>

      <button
        onClick={handleGenerate}
        disabled={loading || !personImage || !fabricImage}
        className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {loading ? '🔄 Processing fabric mix...' : '🎨 Generate Fabric Mix'}
      </button>

      {/* Camera Modal */}
      {cameraTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-4 rounded-lg shadow-xl max-w-2xl w-full">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded"></video>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={takePhoto}
                className="px-6 py-2 bg-yellow-500 text-gray-900 font-semibold rounded-full hover:bg-yellow-400 transition-colors"
              >
                📸 Take Picture
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-colors"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFabricMixer;
