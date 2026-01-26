'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImagePlaceholderProps {
  src: string;
  alt: string;
}

export function ImagePlaceholder({ src, alt }: ImagePlaceholderProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="relative w-full aspect-video bg-surface-secondary border-2 border-dashed border-plum-300 rounded-lg flex flex-col items-center justify-center gap-3 my-6">
        <svg
          className="w-12 h-12 text-plum-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-text-muted text-sm text-center px-4">{alt}</span>
        <span className="text-plum-500 text-xs font-medium">Screenshot coming soon</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video my-6 rounded-lg overflow-hidden border border-border-primary shadow-sm">
      {isLoading && (
        <div className="absolute inset-0 bg-surface-secondary animate-pulse flex items-center justify-center">
          <svg
            className="w-8 h-8 text-plum-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
