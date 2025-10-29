import React, { useState, useRef } from 'react';
import { UploadIcon, SparklesIcon, EditIcon } from './Icons';
import { editImage } from '../services/geminiService';
import Loader from './Loader';

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('File is too large. Please upload an image under 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null); // Clear previous edit on new image
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!originalImage) {
      setError('Please upload an image first.');
      return;
    }
    if (!prompt) {
      setError('Please enter an edit instruction.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const result = await editImage(originalImage, prompt);
      setEditedImage(result);
    } catch (e) {
      console.error(e);
      setError('Failed to edit image. The model may not support this type of edit. Please try again with a different prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-2 text-center">AI Image Editor</h2>
        <p className="text-gray-400 mb-6 text-center">Upload a photo and describe how you want to change it.</p>

        {!originalImage && (
            <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
                <button
                    onClick={handleUploadClick}
                    className="inline-flex items-center justify-center px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all duration-300 ease-in-out hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
                >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Choose Photo
                </button>
            </div>
        )}

        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
        />

        {originalImage && (
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Your Image</label>
                        <img src={originalImage} alt="Original" className="rounded-lg w-full h-auto object-contain max-h-80" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Edited Image</label>
                        <div className="w-full h-full min-h-[200px] bg-gray-900/50 rounded-lg flex items-center justify-center">
                            {isLoading ? <Loader /> : (editedImage ? <img src={editedImage} alt="Edited" className="rounded-lg w-full h-auto object-contain max-h-80" /> : <p className="text-gray-500">Your edit will appear here</p>)}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="relative">
                        <EditIcon className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder='e.g., "Add a retro filter" or "Remove the person in the background"'
                            className="w-full bg-gray-900 text-gray-200 rounded-full p-3 pl-12 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"
                        />
                    </div>
                </div>
                 {error && <p className="text-red-400 mt-2 text-sm text-center">{error}</p>}
                <div className="text-center">
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="group relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg shadow-yellow-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <SparklesIcon className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                    Generate Edit
                    </button>
                </div>
                 <div className="text-center">
                    <button onClick={handleUploadClick} className="text-sm text-yellow-400 hover:underline">
                        Upload a different image
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
