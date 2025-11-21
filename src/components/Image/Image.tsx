import React, { useState, useEffect, useRef } from 'react';
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
  loading?: 'lazy' | 'eager';
  showErrorIcon?: boolean;
}

const isDataURI = (str: string) => str.startsWith('data:');

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
  loading = 'lazy',
  showErrorIcon = true,
  ...imgProps
}: ImageProps) => {
  const [isLoading, setIsLoading] = useState(!isDataURI(src));
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(!isDataURI(src));
    setHasError(false);
  }, [src]);

  // Handle image loading
  useEffect(() => {
    if (!imgRef.current || isDataURI(currentSrc)) return;
    let cancelled = false;
    onLoadStart?.();

    imgRef.current
      .decode()
      .then(() => {
        if (cancelled) return;
        setIsLoading(false);
        setHasError(false);
        onLoadComplete?.();
      })
      .catch(() => {
        if (cancelled) return;
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setIsLoading(true);
          setHasError(false);
        } else {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSrc, fallbackSrc]);

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
          role="img"
          aria-label={`Failed to load image: ${alt}`}
          className={cn(
            typeof skeletonHeight === 'string' ? skeletonHeight : '',
            typeof skeletonWidth === 'string' ? skeletonWidth : '',
            'bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300',
          )}
          style={{
            ...(typeof skeletonHeight === 'number' ? { height: skeletonHeight } : {}),
            ...(typeof skeletonWidth === 'number' ? { width: skeletonWidth } : {}),
          }}
        >
          {showErrorIcon && (
            <div className="text-center text-gray-500">
              <ImageErrorIcon size="xl" className="mx-auto text-gray-500" aria-hidden="true" />
              <p className="text-xs">Failed to load image</p>
            </div>
          )}
        </div>
      )}

      {/* Actual Image - Only render when not in error state */}
      {!hasError && (
        <img
          ref={imgRef}
          {...imgProps}
          src={currentSrc}
          alt={alt}
          loading={loading}
          className={cn(
            imageClassName,
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            {
              'hover:scale-105 transform-gpu origin-center': hoverZoomed,
            },
          )}
          style={{
            width: width ?? undefined,
            height: height ?? undefined,
            ...(fill ? { height: '100%', width: '100%', objectFit: 'cover' } : {}),
          }}
        />
      )}
    </div>
  );
};
