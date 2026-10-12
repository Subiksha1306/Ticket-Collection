'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

export interface FileDropzoneProps {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  disabled?: boolean;
}

export default function FileDropzone({
  label,
  hint = 'PNG, JPG, PDF up to 10MB',
  accept,
  multiple = true,
  onFilesSelected,
  files = [],
  onRemoveFile,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (onFilesSelected) onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      if (onFilesSelected) onFilesSelected(selected);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-[#1a2438] mb-1.5">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`w-full rounded-[14px] border border-dashed transition-all p-6 text-center cursor-pointer backdrop-blur-xs flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'bg-blue-50/70 border-[#3d5a8c] ring-2 ring-[#3d5a8c]/20'
            : 'bg-white/60 hover:bg-white/80 border-white/90 hover:border-[#8795ad]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-[#dfe7f5] flex items-center justify-center text-[#3d5a8c]">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <span className="text-sm font-semibold text-[#3d5a8c] hover:underline">
            Click to upload
          </span>
          <span className="text-sm text-[#6b7a93]"> or drag and drop</span>
        </div>
        {hint && <p className="text-xs text-[#8795ad]">{hint}</p>}
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2.5 rounded-[12px] bg-white/70 border border-white/85 text-sm shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <File className="w-4 h-4 text-[#3d5a8c] shrink-0" />
                <span className="truncate text-xs font-medium text-[#1a2438]">{file.name}</span>
                <span className="text-[11px] text-[#8795ad] shrink-0">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
