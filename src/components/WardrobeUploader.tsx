import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, ShirtIcon, TrashIcon, EditIcon } from './Icons';
import type { Garment } from '../types';
import { compressImageToBase64 } from '../services/firestoreService';
import SubscriptionExpiredNotice from './SubscriptionExpiredNotice';
import type { SubscriptionTier } from '../types';


const WARDROBE_LIMITS = {
  free: 1,
  style_plus: 10,
  style_x: -1,
};


interface WardrobeUploaderProps {
  wardrobe: Garment[];
  onAddToWardrobe: (garment: Garment) => void;
  onUpdateWardrobe: (index: number, garment: Garment) => void;
  onDeleteFromWardrobe: (index: number) => void;
  subscriptionTier: SubscriptionTier;
  subscriptionEndDate?: string;
}


const WardrobeUploader: React.FC<WardrobeUploaderProps> = ({
  wardrobe,
  onAddToWardrobe,
  onUpdateWardrobe,
  onDeleteFromWardrobe,
  subscriptionTier,
  subscriptionEndDate,
}) => {
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ index: number; item: Garment } | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubscriptionExpired = () => {
    if (!subscriptionEndDate) return false;
    const endDate = new Date(subscriptionEndDate);
    return new Date() > endDate;
  };


  const getWardrobeLimit = () => {
    const tier = isSubscriptionExpired() ? 'free' : subscriptionTier;
    return WARDROBE_LIMITS[tier] || WARDROBE_LIMITS.free;
  };


  const getVisibleWardrobe = () => {
    if (isSubscriptionExpired() && subscriptionTier !== 'free') {
      return wardrobe.slice(0, WARDROBE_LIMITS.free);
    }
    const limit = getWardrobeLimit();
    if (limit === -1) return wardrobe;
    return wardrobe.slice(0, limit);
  };


  const canAddMoreItems = () => {
    if (editingItem) return true;
    const limit = getWardrobeLimit();
    if (limit === -1) return true;
    return wardrobe.length < limit;
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!editingItem && !canAddMoreItems()) {
        if (subscriptionTier === 'free') {
          setError(`❌ Free tier: Cannot upload wardrobe items. Upgrade to Style+ for 10 items.`);
        } else if (subscriptionTier === 'style_plus') {
          setError(`❌ Style+ tier: Maximum 10 items reached. Upgrade to StyleX for unlimited.`);
        }
        return;
      }

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

    if (editingItem) {
      const updatedGarment: Garment = {
        image: garmentImage,
        material,
        color
      };
      onUpdateWardrobe(editingItem.index, updatedGarment);
      setEditingItem(null);
    } else {
      const newGarment: Garment = {
        image: garmentImage,
        material,
        color
      };
      onAddToWardrobe(newGarment);
    }
    setGarmentImage(null);
    setMaterial('');
    setColor('');
    setError(null);
  };


  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this item from your wardrobe?')) {
      onDeleteFromWardrobe(index);
      setMenuOpen(null);
    }
  };


  const handleEdit = (index: number, item: Garment) => {
    setEditingItem({ index, item });
    setGarmentImage(item.image);
    setMaterial(item.material);
    setColor(item.color);
    setMenuOpen(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };


  const handlePreview = (image: string) => {
    setPreviewImage(image);
    setMenuOpen(null);
  };


  const handleCancelEdit = () => {
    setEditingItem(null);
    setGarmentImage(null);
    setMaterial('');
    setColor('');
    setError(null);
  };


  const visibleWardrobe = getVisibleWardrobe();
  const wardrobeLimit = getWardrobeLimit();
  
  // ✅ FIXED: Normalize tier comparison
  const isPaidTier = subscriptionTier === 'style_plus' || subscriptionTier === 'style_x';
  const isStyleX = subscriptionTier === 'style_x';


  return (
    <div className="space-y-8 animate-fade-in-up">
      {isSubscriptionExpired() && subscriptionTier !== 'free' && (
        <SubscriptionExpiredNotice
          previousTier={subscriptionTier}
          hiddenItems={wardrobe.length - visibleWardrobe.length}
        />
      )}


      {/* Show wardrobe only for paid tiers with items */}
      {isPaidTier && wardrobe.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-yellow-400 text-center flex-1">
              Your Wardrobe ({visibleWardrobe.length} items)
            </h3>
            <div className="text-xs text-gray-400">
              {wardrobeLimit === -1 ? (
                <span className="text-blue-400">✅ Unlimited (StyleX)</span>
              ) : (
                <span>{visibleWardrobe.length} / {wardrobeLimit}</span>
              )}
            </div>
          </div>

          {wardrobe.length > visibleWardrobe.length && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm mb-4">
              ⚠️ {wardrobe.length - visibleWardrobe.length} items hidden due to plan limitations. Upgrade to access all.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleWardrobe.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 aspect-square"
              >
                <img
                  src={item.image}
                  alt={`${item.color} ${item.material} item`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onClick={() => handlePreview(item.image)}
                />
                <button
                  onClick={() => setMenuOpen(menuOpen === index ? null : index)}
                  className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm text-gray-200 rounded-full p-1.5 hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {menuOpen === index && (
                  <div className="absolute top-10 right-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[140px]">
                    <button
                      onClick={() => handleEdit(index, item)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
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

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
                  <p className="text-sm text-yellow-400 font-semibold">{item.color}</p>
                  <p className="text-xs text-gray-400">{item.material}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ✅ FIXED: Upload form - Show ONLY for paid tiers */}
      {isPaidTier ? (
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

          {!editingItem && subscriptionTier === 'style_plus' && wardrobe.length >= 10 && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 text-blue-300 text-sm mt-4">
              🔒 You've reached the 10 item limit for Style+. Upgrade to StyleX for unlimited.
            </div>
          )}

          {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
          <div className="flex gap-3 mt-6 justify-center">
            {editingItem && (
              <button
                onClick={handleCancelEdit}
                className="px-8 py-3 bg-gray-700 text-gray-200 font-semibold rounded-full hover:bg-gray-600 transition-all duration-300"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isUploading || (!editingItem && !canAddMoreItems())}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold rounded-full shadow-lg shadow-yellow-500/30 transition-all duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Processing...' : editingItem ? 'Update Item' : 'Save to Wardrobe'}
            </button>
          </div>
        </div>
      ) : (
        /* ✅ Show locked message ONLY for FREE tier */
        <div className="bg-gray-800/50 rounded-2xl p-8 border-2 border-yellow-400/30 text-center">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">🔒 Wardrobe Feature Locked</h3>
          <p className="text-gray-300 mb-4">Upgrade to Style+ or StyleX to start building your wardrobe!</p>
          <button className="px-6 py-2 bg-yellow-400 text-gray-900 font-bold rounded-full hover:bg-yellow-500 transition-all">
            Upgrade Plan
          </button>
        </div>
      )}


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
