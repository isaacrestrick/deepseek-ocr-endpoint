'use client';

import { useCallback, useState } from 'react';
import { ImageFile } from '@/lib/types';

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
}

export default function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(`${file.name} is not an image file`);
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`${file.name} is too large (max 10MB)`);
      return false;
    }

    setError('');
    return true;
  };

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newImages: ImageFile[] = [];
    const filesArray = Array.from(fileList);

    filesArray.forEach((file) => {
      if (validateFile(file)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: ImageFile = {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview: reader.result as string,
            name: file.name,
            size: file.size,
          };
          newImages.push(newImage);
          
          if (newImages.length === filesArray.length) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, onImagesChange]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isDragging 
            ? 'border-matrix-cyan bg-matrix-dark-green/20 scale-105' 
            : 'border-matrix-green bg-matrix-dark-green/10 hover:bg-matrix-dark-green/20'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="image-upload"
        />
        <div className="pointer-events-none">
          <div className="text-matrix-green glow text-base mb-2">
            [UPLOAD_IMAGES]
          </div>
          <p className="text-matrix-green/70 text-sm">
            {'>'} Drop images here or click to select
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-500 border border-red-500 p-2 rounded text-xs">
          [ERROR] {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="text-matrix-green glow text-sm">
            [IMAGES_LOADED: {images.length}]
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group matrix-border rounded-lg overflow-hidden bg-matrix-dark-green/20"
              >
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <p className="text-matrix-green text-xs truncate w-full text-center mb-2">
                    {image.name}
                  </p>
                  <p className="text-matrix-green/70 text-xs mb-2">
                    {(image.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    [DELETE]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

