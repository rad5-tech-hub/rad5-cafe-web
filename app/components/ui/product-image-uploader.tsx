import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '~/lib/firebase';
import { api } from '~/lib/api';
import { Icon } from './icon';

interface ProductImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  productName?: string;
}

type TabType = 'upload' | 'search' | 'firestore';

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  productName = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState(productName || 'food');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Firestore gallery state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Load images from Firebase Storage when Gallery tab is opened
  useEffect(() => {
    if (activeTab === 'firestore') {
      setGalleryLoading(true);
      const storageRef = ref(storage, 'product-images');
      listAll(storageRef)
        .then(async (result) => {
          const urls = await Promise.all(
            result.items.map((itemRef) => getDownloadURL(itemRef))
          );
          setExistingImages(urls);
        })
        .catch((err) => {
          console.warn('Could not list Firebase Storage images:', err);
          setExistingImages([]);
        })
        .finally(() => setGalleryLoading(false));
    }
  }, [activeTab]);

  // Handle Unsplash image search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const res = await api.images.search(searchQuery.trim(), 12);
      if (res.success && Array.isArray(res.data)) {
        const cleanedData = res.data.map((img: any, i: number) => {
          const urls = img.urls || {};
          let regular = urls.regular || '';
          let small = urls.small || '';
          let thumb = urls.thumb || '';
          
          if (regular.includes('source.unsplash.com') || !regular) {
            const term = encodeURIComponent(searchQuery.trim().toLowerCase());
            const curated: Record<string, string[]> = {
              coffee: [
                'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
              ],
              burger: [
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
              ],
              pizza: [
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop',
              ],
              tea: [
                'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop',
              ],
              pastry: [
                'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop',
              ],
              cake: [
                'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=800&auto=format&fit=crop',
              ],
              water: [
                'https://images.unsplash.com/photo-1548839133-9fa0a57bd3c5?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=800&auto=format&fit=crop',
              ],
              drink: [
                'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop',
              ],
              rice: [
                'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop',
              ],
              food: [
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop',
              ]
            };
            
            let matched: string[] = [];
            for (const [k, urls] of Object.entries(curated)) {
              if (term.includes(k)) {
                matched.push(...urls);
              }
            }
            if (matched.length === 0) {
              regular = `https://loremflickr.com/800/600/food,cafe,drink,${term}?lock=${i}`;
              small = `https://loremflickr.com/400/300/food,cafe,drink,${term}?lock=${i}`;
              thumb = `https://loremflickr.com/200/150/food,cafe,drink,${term}?lock=${i}`;
            } else {
              const base = matched[i % matched.length];
              regular = base;
              small = base.replace('w=800', 'w=400');
              thumb = base.replace('w=800', 'w=200');
            }
          }
          return {
            ...img,
            urls: { regular, small, thumb }
          };
        });
        setSearchResults(cleanedData);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to search images:', err);
      const term = encodeURIComponent(searchQuery.trim().toLowerCase());
      const curated: Record<string, string[]> = {
        coffee: [
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
        ],
        burger: [
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
        ],
        pizza: [
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop',
        ],
        tea: [
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
        ],
        pastry: [
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop',
        ],
        cake: [
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
        ],
        water: [
          'https://images.unsplash.com/photo-1548839133-9fa0a57bd3c5?w=800&auto=format&fit=crop',
        ],
        drink: [
          'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=800&auto=format&fit=crop',
        ],
        rice: [
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop',
        ],
        food: [
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop',
        ]
      };
      
      let matched: string[] = [];
      for (const [k, urls] of Object.entries(curated)) {
        if (term.includes(k)) {
          matched.push(...urls);
        }
      }
      if (matched.length === 0) {
        matched = curated.food;
      }

      const fallbackList = Array.from({ length: 12 }).map((_, i) => {
        const base = matched[i % matched.length];
        const hasCuratedMatch = term.includes('coffee') || term.includes('burger') || term.includes('pizza') || term.includes('tea') || term.includes('pastry') || term.includes('cake') || term.includes('water') || term.includes('drink') || term.includes('rice');
        
        const regular = hasCuratedMatch ? base : `https://loremflickr.com/800/600/food,cafe,drink,${term}?lock=${i}`;
        const small = hasCuratedMatch ? base.replace('w=800', 'w=400') : `https://loremflickr.com/400/300/food,cafe,drink,${term}?lock=${i}`;
        const thumb = hasCuratedMatch ? base.replace('w=800', 'w=200') : `https://loremflickr.com/200/150/food,cafe,drink,${term}?lock=${i}`;

        return {
          id: `local-fallback-${i}`,
          urls: { regular, small, thumb },
          alt_description: searchQuery,
          user: { name: 'Local Search' }
        };
      });
      setSearchResults(fallbackList);
    } finally {
      setSearchLoading(false);
    }
  };

  // Upload file helper
  const uploadFileToFirebase = async (file: File) => {
    setLoading(true);
    setUploadProgress('Uploading to storage...');
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `product-images/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
      setUploadProgress('');
    } catch (err: any) {
      console.error('Firebase Storage upload error:', err);
      setUploadProgress('Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download a remote image as a Blob (handles CORS via Image + Canvas)
  const downloadRemoteImage = (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get 2d context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('canvas.toBlob returned null'));
            },
            'image/jpeg',
            0.92
          );
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
      img.src = url;
    });
  };

  // Select Unsplash image and download/upload it to Firebase Storage
  const handleSelectSearchImage = async (url: string) => {
    setLoading(true);
    setUploadProgress('Downloading & securing image...');
    try {
      // Try Image+Canvas first (robust CORS handling for image servers)
      let blob: Blob;
      try {
        blob = await downloadRemoteImage(url);
      } catch (_canvasErr) {
        // Fallback: try direct fetch
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }
        blob = await response.blob();
      }

      // Upload blob to Firebase Storage
      const fileExt = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `product-images/${Date.now()}_unsplash_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
      setUploadProgress('');
    } catch (err) {
      console.error('Failed to save search image to Firebase Storage:', err);
      setUploadProgress('Failed to secure image. Using fallback link...');
      onChange(url);
      setUploadProgress('');
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadFileToFirebase(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToFirebase(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-text-main">Product Image</label>
      <div className="flex items-center gap-4 bg-bg-element border border-border rounded-xl p-3.5 w-full">
        {/* Compact Thumbnail Slot */}
        <div 
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-bg-page flex items-center justify-center cursor-pointer hover:border-tint transition-all"
        >
          {value ? (
            <img
              src={value}
              alt="Selected product preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-text-secondary">
              <Icon name="camera" size={24} />
            </div>
          )}
        </div>

        {/* Text/Button Actions */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="bg-bg-selected text-text-main border border-border hover:bg-bg-selected/80 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {value ? 'Change Image' : 'Choose Image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-error-val hover:underline font-bold text-xs py-1.5 cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
          <span className="text-[10px] text-text-secondary">
            {value ? 'Image selected successfully' : 'No image selected yet'}
          </span>
        </div>
      </div>

      {/* Large Backdrop Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div
            className="relative bg-card border border-border w-full max-w-lg rounded-2xl flex flex-col gap-5 shadow-2xl p-6 animate-scale-up"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text-main">Choose Product Image</h3>
                <p className="text-text-secondary text-xs mt-0.5">
                  Select a photo from local files, search the web, or browse the gallery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-text-main font-bold p-1 rounded-full hover:bg-bg-selected"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 p-0.5 bg-bg-selected/20 rounded-lg border border-border text-center">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'upload' ? 'bg-card text-tint border border-border shadow-xs' : 'text-text-secondary'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`py-2 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'search' ? 'bg-card text-tint border border-border shadow-xs' : 'text-text-secondary'
                }`}
              >
                Web Search
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('firestore')}
                className={`py-2 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'firestore' ? 'bg-card text-tint border border-border shadow-xs' : 'text-text-secondary'
                }`}
              >
                Gallery
              </button>
            </div>

            {/* Large Preview Area */}
            <div className="relative w-full h-48 rounded-xl border border-border overflow-hidden bg-bg-page flex items-center justify-center">
              {value ? (
                <>
                  <img
                    src={value}
                    alt="Large preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-black/60 py-1 px-3 rounded-full">
                      ✓ Image Secured & Selected
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-secondary">
                  <Icon name="camera" size={32} />
                  <span className="text-xs font-semibold">No image selected</span>
                </div>
              )}
            </div>

            {/* Tab Panels */}
            <div className="min-h-[160px] flex flex-col justify-center border border-border/50 rounded-xl p-3 bg-bg-element/30">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-2 py-6">
                  <svg className="animate-spin h-7 w-7 text-tint" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-semibold text-text-secondary">{uploadProgress}</span>
                </div>
              )}

              {!loading && activeTab === 'upload' && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-tint bg-tint/5'
                      : 'border-border hover:border-tint hover:bg-bg-selected/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-8 h-8 rounded-full bg-tint/10 flex items-center justify-center text-tint mb-2">
                    <Icon name="arrow-up" size={16} />
                  </div>
                  <span className="text-xs font-bold text-text-main">
                    Drag & Drop file here
                  </span>
                  <span className="text-[10px] text-text-secondary mt-1">
                    or click to browse local files (JPG, PNG, WebP)
                  </span>
                </div>
              )}

              {!loading && activeTab === 'search' && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. burger, latte, donut"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      className="flex-1 bg-bg-element border border-border text-text-main text-xs outline-none rounded-lg px-2.5 py-1.5 focus:border-tint"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      disabled={searchLoading}
                      className="bg-tint hover:opacity-90 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      {searchLoading ? '...' : 'Search'}
                    </button>
                  </div>

                  {searchLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <svg className="animate-spin h-5 w-5 text-tint" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <span className="text-[11px] text-text-secondary text-center py-6">
                      Enter keyword to search Unsplash food library
                    </span>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-0.5 border border-border/50 rounded-lg">
                      {searchResults.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            handleSelectSearchImage(img.urls.regular);
                          }}
                          className="group relative h-12 rounded-md overflow-hidden bg-bg-page border border-border cursor-pointer hover:border-tint"
                          title={`By ${img.user.name}`}
                        >
                          <img
                            src={img.urls.small || img.urls.thumb}
                            alt={img.alt_description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-tint/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loading && activeTab === 'firestore' && (
                <div className="flex flex-col justify-center">
                  {galleryLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <svg className="animate-spin h-5 w-5 text-tint" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : existingImages.length === 0 ? (
                    <span className="text-[11px] text-text-secondary text-center py-6">
                      No images found in Firebase Storage
                    </span>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-0.5 border border-border/50 rounded-lg">
                      {existingImages.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onChange(url)}
                          className="group relative h-12 rounded-md overflow-hidden bg-bg-page border border-border cursor-pointer hover:border-tint"
                        >
                          <img
                            src={url}
                            alt={`Gallery product ${i}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-tint/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-tint hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
