import React, { useState, useEffect } from 'react';
import { cn } from '@/utils';
import { Skeleton } from '../Skeleton';
import { ImageErrorIcon } from '../Icons';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  skeletonClassName?: string;
  containerClassName?: string;
  imageClassName?: string;
  showSkeleton?: boolean;
  skeletonHeight?: string | number;
  skeletonWidth?: string | number;
  hoverZoomed?: boolean;
  fallbackSrc?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export const Image = ({
  src,
  alt,
  fill = false,
  width,
  height,
  skeletonClassName,
  containerClassName,
  imageClassName,
  showSkeleton = true,
  skeletonHeight = 'h-48',
  skeletonWidth = 'w-full',
  hoverZoomed = false,
  fallbackSrc,
  onLoadStart,
  onLoadComplete,
  onError,
  ...imgProps
}: ImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(src);
    onLoadStart?.();
  }, [src, onLoadStart]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
    onError?.();
  };

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{
        ...(fill ? { height: '100%', width: '100%' } : {}),
      }}
    >
      {/* Skeleton Loading */}
      {isLoading && showSkeleton && (
        <Skeleton
          className={cn(
            'absolute inset-0',
            typeof skeletonHeight === 'string' && skeletonHeight,
            typeof skeletonWidth === 'string' && skeletonWidth,
            skeletonClassName,
          )}
          width={width}
          height={height}
          fill={fill}
          style={{
            ...(typeof skeletonHeight === 'number' ? { height: skeletonHeight } : {}),
            ...(typeof skeletonWidth === 'number' ? { width: skeletonWidth } : {}),
          }}
        />
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div
          className={cn(
            skeletonHeight,
            skeletonWidth,
            'bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300',
          )}
        >
          <div className="text-center text-gray-500">
            <ImageErrorIcon size="xl" className="mx-auto text-gray-500" />
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      <img
        {...imgProps}
        src={currentSrc}
        alt={alt}
        className={cn(
          imageClassName,
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          {
            'hover:scale-105': hoverZoomed,
          },
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          display: hasError ? 'none' : 'block',
          width: width ?? undefined,
          height: height ?? undefined,
          ...(fill ? { height: '100%', width: '100%' } : {}),
        }}
      />
    </div>
  );
};
