'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentAvatar } from './student-avatar';

interface StudentPhotoUploadProps {
  currentPhoto?: string | null;
  studentName: string;
  onPhotoChange: (file: File) => void;
  onPhotoRemove?: () => void;
  isUploading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * StudentPhotoUpload Component
 * Photo upload with drag-and-drop, preview, and validation
 */
export function StudentPhotoUpload({
  currentPhoto,
  studentName,
  onPhotoChange,
  onPhotoRemove,
  isUploading = false,
}: StudentPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format file harus JPEG, PNG, atau WebP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Ukuran file maksimal 5MB';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onPhotoChange(file);
  }, [onPhotoChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  }, [onPhotoRemove]);

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="flex items-start gap-4">
          <StudentAvatar name={studentName} photo={preview} size="xl" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Foto siswa</p>
            {!isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Hapus Foto
              </Button>
            )}
            {isUploading && (
              <p className="text-sm text-muted-foreground">Mengupload...</p>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleChange}
            disabled={isUploading}
          />
          <label
            htmlFor="photo-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Mengupload...' : 'Klik untuk upload atau drag & drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, atau WebP (maks. 5MB)
              </p>
            </div>
          </label>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
