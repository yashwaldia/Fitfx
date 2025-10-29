
import React, { useRef, useState } from 'react';
import { UploadIcon, UserCircleIcon } from './Icons';

interface SelfieUploaderProps {
  onImageUpload: (imageBase64: string) => void;
  uploadedImage: string | null;
}

const SelfieUploader: React.FC<SelfieUploaderProps> = ({ onImageUpload, uploadedImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('File is too large. Please upload an image under 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
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

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[inset_5px_5px_10px_#1a1a1a,inset_-5px_-5px_10px_#2c2c2c] border border-gray-700">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-40 h-40 rounded-full flex-shrink-0 bg-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
          {uploadedImage ? (
            <img src={uploadedImage} alt="Selfie preview" className="w-full h-full object-cover" />
          ) : (
            <UserCircleIcon className="w-24 h-24 text-gray-500" />
          )}
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-2">Upload Your Selfie</h2>
          <p className="text-gray-400 mb-4">Let's find the perfect colors and styles that make you shine. Upload a clear, well-lit photo for the best results.</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="inline-flex items-center justify-center px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all duration-300 ease-in-out hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            {uploadedImage ? 'Change Photo' : 'Choose Photo'}
          </button>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default SelfieUploader;
