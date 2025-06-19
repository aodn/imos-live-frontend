import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragIndicatorIcon, CloseIcon } from '../Icons';
import { Button } from '../Button';

import { clamp, cn } from '@/utils';

type Direction = 'left' | 'right' | 'top' | 'bottom';
type SnapPoint = number | `${number}%`;

export interface DrawerProps {
  direction: Direction;
  snapPoints: SnapPoint[];
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  snapMode?: 'free' | 'snap';
  isOpen: boolean;
  closeDrawer: () => void;
  handleHidden?: boolean;
}

function getClosestSnapPoint(value: number, snapPoints: number[]) {
  return snapPoints.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function animateToSnapPoint(
  start: number,
  end: number,
  cb: (value: number) => void,
  done: () => void,
) {
  const duration = 100;
  const startTime = performance.now();

  function animate(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const value = start + (end - start) * eased;
    cb(value);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      cb(end);
      done();
    }
  }
  requestAnimationFrame(animate);
}

// Converts snapPoint to px value based on direction and window size
function parseSnapPoint(sp: SnapPoint, direction: Direction): number {
  if (typeof sp === 'number') return sp;
  const percent = parseFloat(sp) / 100;
  return direction === 'left' || direction === 'right'
    ? window.innerWidth * percent
    : window.innerHeight * percent;
}
function resolveSnapPoints(snapPoints: SnapPoint[], direction: Direction) {
  return snapPoints.map(sp => parseSnapPoint(sp, direction));
}

// Get maximum allowed size for the drawer based on direction
function getMaxSize(direction: Direction): number {
  return direction === 'left' || direction === 'right' ? window.innerWidth : window.innerHeight;
}

export const Drawer: React.FC<DrawerProps> = ({
  direction,
  snapPoints,
  children,
  onClose,
  className = '',
  snapMode = 'free',
  isOpen,
  closeDrawer,
  handleHidden = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialSize: 0 });
  const [currentSize, setCurrentSize] = useState(0);
  const [minCloseThreshold] = useState(300);
  const [resolvedSnapPoints, setResolvedSnapPoints] = useState<number[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = direction === 'left' || direction === 'right';

  // Whenever snapPoints or window size changes, update resolved snap points
  const updateResolvedSnapPoints = useCallback(() => {
    setResolvedSnapPoints(resolveSnapPoints(snapPoints, direction));
  }, [snapPoints, direction]);

  useEffect(() => {
    updateResolvedSnapPoints();
    window.addEventListener('resize', updateResolvedSnapPoints);
    return () => {
      window.removeEventListener('resize', updateResolvedSnapPoints);
    };
  }, [updateResolvedSnapPoints]);

  // Reset to the first snap point on open
  useEffect(() => {
    if (isOpen && resolvedSnapPoints.length > 0) {
      setCurrentSize(resolvedSnapPoints[0]);
    }
  }, [isOpen, resolvedSnapPoints]);

  const getDrawerSize = useCallback(() => {
    if (!isOpen) return 0;
    return currentSize;
  }, [isOpen, currentSize]);

  const handleClose = useCallback(() => {
    closeDrawer();
    if (onClose) {
      onClose();
    }
  }, [closeDrawer, onClose]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      initialSize: currentSize,
    });
  };

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      let delta: number;

      // Calculate delta based on direction - for closing behavior
      if (isHorizontal) {
        // For horizontal drawers, positive delta = expanding, negative = shrinking
        delta =
          direction === 'left'
            ? clientX - dragStart.x // drag right = expand
            : dragStart.x - clientX; // drag left = expand
      } else {
        // For vertical drawers, positive delta = expanding, negative = shrinking
        delta =
          direction === 'top'
            ? clientY - dragStart.y // drag down = expand
            : dragStart.y - clientY; // drag up = expand
      }

      const maxSize = getMaxSize(direction);
      const newSize = clamp(maxSize, 0, dragStart.initialSize + delta);

      setCurrentSize(newSize);
    },
    [isDragging, isHorizontal, direction, dragStart],
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // Always check for close threshold first, regardless of snap mode
    if (currentSize < minCloseThreshold) {
      animateToSnapPoint(currentSize, 0, setCurrentSize, handleClose);
      return;
    }

    // Only snap if we're not closing
    if (snapMode === 'snap') {
      const snap = getClosestSnapPoint(currentSize, resolvedSnapPoints);
      animateToSnapPoint(currentSize, snap, setCurrentSize, () => {});
    }
  }, [isDragging, currentSize, minCloseThreshold, handleClose, resolvedSnapPoints, snapMode]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    },
    [handleMove],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    },
    [handleEnd],
  );

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, handleMouseMove, handleMouseUp]);

  const getDrawerStyles = () => {
    const size = getDrawerSize();
    const baseClasses =
      'fixed overflow-hidden rounded bg-white shadow-2xl transition-all duration-300 ease-out z-50 border-gray-200';

    if (!isOpen) {
      switch (direction) {
        case 'left':
          return {
            className: `${baseClasses} top-0 left-0 h-full border-r`,
            style: { width: '0px', transform: 'translateX(-100%)' },
          };
        case 'right':
          return {
            className: `${baseClasses} top-0 right-0 h-full border-l`,
            style: { width: '0px', transform: 'translateX(100%)' },
          };
        case 'top':
          return {
            className: `${baseClasses} top-0 left-0 w-full border-b`,
            style: { height: '0px', transform: 'translateY(-100%)' },
          };
        case 'bottom':
          return {
            className: `${baseClasses} bottom-0 left-0 w-full border-t`,
            style: { height: '0px', transform: 'translateY(100%)' },
          };
      }
    }

    switch (direction) {
      case 'left':
        return {
          className: `${baseClasses} top-0 left-0 h-full border-r`,
          style: {
            width: `${size}px`,
            transform: 'translateX(0)',
            transitionDuration: isDragging ? '0ms' : '300ms',
          },
        };
      case 'right':
        return {
          className: `${baseClasses} top-0 right-0 h-full border-l`,
          style: {
            width: `${size}px`,
            transform: 'translateX(0)',
            transitionDuration: isDragging ? '0ms' : '300ms',
          },
        };
      case 'top':
        return {
          className: `${baseClasses} top-0 left-0 w-full border-b`,
          style: {
            height: `${size}px`,
            transform: 'translateY(0)',
            transitionDuration: isDragging ? '0ms' : '300ms',
          },
        };
      case 'bottom':
        return {
          className: `${baseClasses} bottom-0 left-0 w-full border-t`,
          style: {
            height: `${size}px`,
            transform: 'translateY(0)',
            transitionDuration: isDragging ? '0ms' : '300ms',
          },
        };
      default:
        return { className: baseClasses, style: {} };
    }
  };

  const getResizeHandleStyles = () => {
    const handleClasses =
      'absolute flex items-center justify-center hover:bg-imos-grey/20 transition-colors duration-200 z-10';

    switch (direction) {
      case 'left':
        return `${handleClasses} top-0 right-0 w-3 h-full hover:w-3`;
      case 'right':
        return `${handleClasses} top-0 left-0 w-3 h-full hover:w-3`;
      case 'top':
        return `${handleClasses} bottom-0 left-0 w-full h-3 hover:h-3`;
      case 'bottom':
        return `${handleClasses} top-0 left-0 w-full h-3 hover:h-3`;
      default:
        return handleClasses;
    }
  };

  const getHandleIconStyles = () => {
    switch (direction) {
      case 'left':
        return '';
      case 'right':
        return '';
      case 'top':
        return 'rotate-90';
      case 'bottom':
        return 'rotate-90';
      default:
        return '';
    }
  };

  const drawerStyles = getDrawerStyles();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
          onClick={handleClose}
          onKeyDown={e => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              handleClose();
            }
          }}
        />
      )}

      <div
        ref={drawerRef}
        className={`${drawerStyles.className} ${className}`}
        style={drawerStyles.style}
      >
        <div
          className={cn(getResizeHandleStyles(), {
            hidden: handleHidden,
          })}
        >
          <button
            type="button"
            aria-label="Drawer handle"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <DragIndicatorIcon className={getHandleIconStyles()} size="sm" />
          </button>
        </div>

        <Button
          className="absolute top-0 right-0 cursor-pointer z-10 hidden md:block"
          variant="ghost"
          onClick={handleClose}
        >
          <CloseIcon onClick={handleClose} />
        </Button>

        <div className="h-full w-full overflow-auto p-4">{children}</div>
      </div>
    </>
  );
};
