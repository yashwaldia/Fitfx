import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dressData } from '../data/dressData';
import { addWatermark } from '../utils/canvasUtils';

interface AITryOnProps {
  onError?: (error: string) => void;
}

const AITryOn: React.FC<AITryOnProps> = ({ onError }) => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('India');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [dressName, setDressName] = useState<string>('');
  const [dressColor, setDressColor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const countries = Array.from(new Set(dressData.map(d => d.country)));
  const genders: Array<'female' | 'male'> = ['female', 'male'];
  const filteredDresses = dressData.filter(d => d.country === country && d.gender === gender);

  useEffect(() => {
    setDressName('');
  }, [country, gender]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        onError?.('❌ File is too large. Please upload an image under 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieImage(reader.result as string);
        setEditedImage(null);
      };
      reader.onerror = () => onError?.('❌ Failed to read the image file.');
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        setIsCameraOpen(true);
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
    setIsCameraOpen(false);
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
        setSelfieImage(dataUrl);
        setEditedImage(null);
      }
      stopCamera();
    }
  };

  const handleGenerate = async () => {
    if (!selfieImage) {
      onError?.('❌ Please upload or take a selfie first.');
      return;
    }
    if (!dressName) {
      onError?.('❌ Please select a dress type.');
      return;
    }

    setLoading(true);

    try {
      const selectedDress = dressData.find(
        d => d.country === country && d.gender === gender && d.dress_name === dressName
      );

      const generationPrompt = `Reimagine the person in this photo wearing a new outfit. The outfit is a ${dressColor || ''} ${dressName}. This is a ${gender} garment from ${country}, described as: "${selectedDress?.description || ''}". Change the clothing to match the description, fitting it realistically to the person's body. The person's face, hair, and features MUST be preserved. The background can be subtly changed to complement the new outfit's style.`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const base64Image = selfieImage.split(',')[1];

      const response = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        generationPrompt,
      ]);

      const result = await response.response;
      if (result.candidates?.[0]?.content?.parts?.[0]) {
        const part = result.candidates[0].content.parts[0];
        if ('text' in part) {
          setEditedImage(part.text as string);
        }
      }
    } catch (e) {
      console.error(e);
      onError?.('❌ Failed to generate image. Please try again.');
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
      link.download = 'fitfx-creation.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      onError?.('❌ Failed to process image for download.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Selfie Input */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 text-center">1. Your Photo</h3>
          <div className="w-full aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
            {selfieImage ? <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" /> : <p className="text-gray-500">Selfie appears here</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUploadClick}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900"
            >
              📤 Upload
            </button>
            <button
              onClick={startCamera}
              className="w-full flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-gray-900"
            >
              📷 Selfie
            </button>
          </div>
        </div>

        {/* Right: Dress Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 text-center">2. Design Outfit</h3>

          <div>
            <label className="text-sm font-medium text-gray-400">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'female' | 'male')}
              className="w-full mt-1 bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none"
            >
              {genders.map(g => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Dress Type</label>
            <select
              value={dressName}
              onChange={(e) => setDressName(e.target.value)}
              className="w-full mt-1 bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none"
            >
              <option value="" disabled>Select a dress</option>
              {filteredDresses.map(d => (
                <option key={d.dress_name} value={d.dress_name}>{d.dress_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400">Color</label>
            <input
              type="text"
              value={dressColor}
              onChange={(e) => setDressColor(e.target.value)}
              placeholder="e.g., #FFD700, Gold"
              className="w-full mt-1 bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Result */}
      <div>
        <h3 className="text-lg font-semibold text-yellow-400 text-center mb-4">3. AI Generated Image</h3>
        <div className="bg-gray-900/50 rounded-lg flex items-center justify-center flex-col p-4 w-full aspect-video">
          {loading ? (
            <div className="text-center space-y-2">
              <div className="inline-block animate-spin text-2xl">🔄</div>
              <p className="text-gray-400">Generating your image...</p>
            </div>
          ) : editedImage ? (
            <>
              <img src={editedImage} alt="Generated result" className="rounded-lg w-full h-auto object-contain max-h-[50vh]" />
              <button
                onClick={handleDownload}
                disabled={isActionLoading}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all hover:bg-yellow-400 hover:text-gray-900 disabled:opacity-50"
              >
                ⬇️ Download
              </button>
            </>
          ) : (
            <p className="text-gray-500">Your virtual try-on will appear here</p>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
      <canvas ref={canvasRef} className="hidden"></canvas>

      <button
        onClick={handleGenerate}
        disabled={loading || !selfieImage}
        className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {loading ? '🔄 Processing...' : '🎨 Generate Try-On'}
      </button>

      {/* Camera Modal */}
      {isCameraOpen && (
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

export default AITryOn;