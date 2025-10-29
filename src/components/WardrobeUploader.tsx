import React, { useState, useRef } from 'react';
import { UploadIcon, ShirtIcon, TrashIcon, EditIcon } from './Icons';
import type { Garment } from '../types';
import { compressImageToBase64 } from '../services/firestoreService';

interface WardrobeUploaderProps {
  wardrobe: Garment[];
  onAddToWardrobe: (garment: Garment) => void;
}

const WardrobeUploader: React.FC<WardrobeUploaderProps> = ({ wardrobe, onAddToWardrobe }) => {
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ index: number; item: Garment } | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('File is too large. Please upload an image under 4MB.');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const compressedBase64 = await compressImageToBase64(file, 500);
        setGarmentImage(compressedBase64);
      } catch (err) {
        console.error('Error compressing image:', err);
        setError('Failed to process the image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSave = () => {
    if (!garmentImage || !material || !color) {
        setError('Please upload an image and fill in all fields.');
        return;
    }
    const newGarment: Garment = { image: garmentImage, material, color };
    onAddToWardrobe(newGarment);
    
    // Reset form
    setGarmentImage(null);
    setMaterial('');
    setColor('');
    setError(null);
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedWardrobe = wardrobe.filter((_, i) => i !== index);
      // You'll need to add onDeleteFromWardrobe prop and implement in App.tsx
      console.log('Delete item at index:', index);
      setMenuOpen(null);
    }
  };

  const handleEdit = (index: number, item: Garment) => {
    setEditingItem({ index, item });
    setGarmentImage(item.image);
    setMaterial(item.material);
    setColor(item.color);
    setMenuOpen(null);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreview = (image: string) => {
    setPreviewImage(image);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
        {/* Wardrobe Items Grid - Now at the top */}
        {wardrobe.length > 0 && (
            <div>
                 <h3 className="text-xl font-semibold text-yellow-400 mb-4 text-center">Your Wardrobe ({wardrobe.length} items)</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {wardrobe.map((item, index) => (
                        <div 
                            key={index} 
                            className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-yellow-400/50 group"
                        >
                            <img 
                                src={item.image} 
                                alt={`${item.color} ${item.material} item`} 
                                className="w-full h-32 object-cover cursor-pointer" 
                                onClick={() => handlePreview(item.image)}
                            />
                            
                            {/* Three-dot menu button */}
                            <button
                                onClick={() => setMenuOpen(menuOpen === index ? null : index)}
                                className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm text-gray-200 rounded-full p-1.5 hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpen === index && (
                                <div className="absolute top-10 right-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[140px]">
                                    <button
                                        onClick={() => handleEdit(index, item)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            )}

                            <div className="p-2 text-center">
                                <p className="text-sm font-semibold text-yellow-400">{item.color}</p>
                                <p className="text-xs text-gray-400">{item.material}</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* Add to Wardrobe Form - Now at the bottom */}
        <div className="bg-gray-800/50 rounded-2xl p-6 shadow-[5px_5px_10px_#1a1a1a,_-5px_-5px_10px_#2c2c2c] border border-gray-700">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-2 text-center">
                {editingItem ? 'Edit Wardrobe Item' : 'Add to Your Wardrobe'}
            </h2>
            <p className="text-gray-400 mb-6 text-center">
                {editingItem ? 'Update your clothing details' : 'Upload photos of your clothes so our AI can help you style them.'}
            </p>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-40 h-40 rounded-2xl flex-shrink-0 bg-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
                    {garmentImage ? (
                        <img src={garmentImage} alt="Garment preview" className="w-full h-full object-cover" />
                    ) : (
                        <ShirtIcon className="w-24 h-24 text-gray-500" />
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                        </div>
                    )}
                </div>
                <div className="w-full space-y-4">
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="w-full inline-flex items-center justify-center px-6 py-2 bg-gray-700 text-yellow-400 font-semibold rounded-full border-2 border-yellow-400/50 transition-all duration-300 ease-in-out hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        {isUploading ? 'Compressing...' : garmentImage ? 'Change Photo' : 'Choose Photo'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                    />
                     <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="Material (e.g., Cotton, Silk, Denim)"
                        className="w-full bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"
                        disabled={isUploading}
                    />
                     <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Color (e.g., Navy Blue, Black)"
                        className="w-full bg-gray-900 text-gray-200 rounded-full p-2 px-4 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300"
                        disabled={isUploading}
                    />
                </div>
            </div>
            {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
            <div className="flex gap-3 mt-6 justify-center">
                {editingItem && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setGarmentImage(null);
                            setMaterial('');
                            setColor('');
                            setError(null);
                        }}
                        className="px-8 py-3 bg-gray-700 text-gray-200 font-semibold rounded-full hover:bg-gray-600 transition-all duration-300"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg shadow-yellow-500/30 transition-all duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Processing...' : editingItem ? 'Update Item' : 'Save to Wardrobe'}
                </button>
            </div>
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
            <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setPreviewImage(null)}
            >
                <div className="relative max-w-4xl max-h-[90vh]">
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute -top-12 right-0 text-white hover:text-yellow-400 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        )}

        {/* Close menu when clicking outside */}
        {menuOpen !== null && (
            <div 
                className="fixed inset-0 z-0" 
                onClick={() => setMenuOpen(null)}
            />
        )}
    </div>
  );
};

export default WardrobeUploader;
