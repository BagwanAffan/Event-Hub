'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/services/storage-service';
import { toast } from 'sonner';

interface BannerUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function BannerUpload({ value, onChange, className = '' }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Unsupported format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error(`Image exceeds 5 MB limit (${formatFileSize(file.size)}). Please select a smaller file.`);
      return;
    }

    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
    });

    try {
      setUploading(true);
      toast.loading('Uploading banner image...', { id: 'banner-upload' });

      let publicUrl = '';
      try {
        publicUrl = await storageService.uploadFile('event-banners', 'banners', file);
      } catch (err: any) {
        console.warn('Storage bucket upload error, attempting fallback to "events" bucket:', err);
        try {
          publicUrl = await storageService.uploadFile('events', 'banners', file);
        } catch (err2: any) {
          console.warn('Bucket upload error, converting to Data URL fallback:', err2);
          publicUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      }

      onChange(publicUrl);
      toast.success('Banner image uploaded successfully! ✨', { id: 'banner-upload' });
    } catch (err: any) {
      console.error('Error uploading banner:', err);
      toast.error(err?.message || 'Failed to upload banner image', { id: 'banner-upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Banner image removed');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 group shadow-md">
          <div className="relative w-full h-48 sm:h-56 overflow-hidden">
            <img
              src={value}
              alt="Event Banner Preview"
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 backdrop-blur hover:bg-white text-xs font-semibold shadow-sm"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${uploading ? 'animate-spin' : ''}`} />
                Replace Image
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={uploading}
                className="text-xs font-semibold shadow-sm"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>

            <div className="absolute bottom-3 left-4 right-4 z-10 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/90 text-white border-0 text-[10px] font-bold">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
                </Badge>
                {fileDetails && (
                  <span className="text-xs text-slate-200 font-mono truncate max-w-[220px]">
                    {fileDetails.name} ({fileDetails.size})
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                JPG, PNG, WEBP • Max 5 MB
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-[#007C46] bg-[#edfcf6] dark:bg-teal-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-[#7CEAAB] hover:bg-slate-100/50 dark:hover:bg-slate-900/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3.5 rounded-full bg-[#edfcf6] dark:bg-teal-950/50 text-[#007C46] shadow-xs">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#01424E] dark:text-teal-100">
                Click to upload <span className="font-normal text-slate-500 dark:text-slate-400">or drag & drop</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, JPEG, PNG or WEBP (Max 5 MB)
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-[#007C46] font-bold">
                <RefreshCw className="h-4 w-4 animate-spin" /> Uploading image...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
