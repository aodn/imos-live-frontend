import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from './useToast';

export interface ToastData {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  closable?: boolean;
  persistent?: boolean;
  showProgressBar?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  titleClassName?: string;
  messageClassName?: string;
  iconClassName?: string;
  closeButtonClassName?: string;
  progressBarClassName?: string;
  onClose?: () => void;
  onClick?: () => void;
  renderIcon?: () => React.ReactNode;
  renderCloseButton?: () => React.ReactNode;
}

const Toast: React.FC<{ toast: ToastData }> = ({ toast }) => {
  const { hideToast } = useToast();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    if (toast.onClose) {
      toast.onClose();
    }
    hideToast(toast.id);
  }, [toast, hideToast]);

  const handleClick = useCallback(() => {
    if (toast.onClick) {
      toast.onClick();
    }
  }, [toast]);

  const handleMouseEnter = useCallback(() => {
    if (toast.pauseOnHover !== false) {
      setIsPaused(true);
    }
  }, [toast.pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (toast.pauseOnHover !== false) {
      setIsPaused(false);
    }
  }, [toast.pauseOnHover]);

  // Progress bar and auto-hide logic
  useEffect(() => {
    if (toast.persistent || toast.duration === 0) {
      return;
    }

    const duration = toast.duration || 5000;
    const updateInterval = 16; // ~60fps
    let startTime = Date.now();
    let remainingTime = duration;

    const updateProgress = () => {
      if (isPaused) {
        startTime = Date.now() - (duration - remainingTime);
        return;
      }

      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, duration - elapsed);
      const progressPercent = (remainingTime / duration) * 100;

      setProgress(progressPercent);

      if (remainingTime <= 0) {
        handleClose();
      }
    };

    // Initial setup
    setProgress(100);

    // Start the progress interval
    intervalRef.current = setInterval(updateProgress, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.duration, toast.persistent, isPaused, handleClose]);

  // Default icons
  const getDefaultIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Theme classes
  const getTypeClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColorClass = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  // Progress bar color based on toast type
  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/10';
      case 'error':
        return 'bg-red-500/10';
      case 'warning':
        return 'bg-yellow-500/10';
      case 'info':
        return 'bg-blue-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div
      className={clsx(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm overflow-hidden',
        'transform transition-all duration-300 ease-in-out',
        'hover:shadow-xl hover:scale-105',
        getTypeClasses(),
        toast.onClick && 'cursor-pointer',
        toast.className,
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={toast.onClick ? 'button' : undefined}
      tabIndex={toast.onClick ? 0 : undefined}
      onKeyDown={
        toast.onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-pressed={toast.onClick ? 'false' : undefined}
    >
      {/* Progress Bar */}
      {toast.showProgressBar !== false && !toast.persistent && toast.duration !== 0 && (
        <div className="absolute inset-0 h-full bg-black/10 pointer-events-none" aria-hidden="true">
          <div
            className={clsx(
              'h-full transition-all duration-75 ease-linear',
              getProgressBarColor(),
              toast.progressBarClassName,
            )}
            style={{
              width: `${progress}%`,
              transition: isPaused ? 'none' : undefined,
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div className={clsx('flex-shrink-0 mt-0.5', getIconColorClass(), toast.iconClassName)}>
        {toast.renderIcon ? toast.renderIcon() : getDefaultIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={clsx('font-semibold text-sm mb-1', toast.titleClassName)}>
            {toast.title}
          </h4>
        )}
        <p className={clsx('text-xs leading-relaxed', toast.messageClassName)}>{toast.message}</p>
      </div>

      {/* Close Button */}
      {toast.closable !== false && (
        <button
          onClick={e => {
            e.stopPropagation();
            handleClose();
          }}
          className={clsx(
            'flex-shrink-0 p-1 rounded-md transition-colors',
            'hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2',
            getIconColorClass(),
            toast.closeButtonClassName,
          )}
          aria-label="Close notification"
        >
          {toast.renderCloseButton ? toast.renderCloseButton() : <X className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

// Toast Container
export const ToastContainer: React.FC<{ toasts: ToastData[] }> = ({ toasts }) => {
  // Group toasts by position
  const groupedToasts = toasts.reduce(
    (acc, toast) => {
      const position = toast.position || 'top-right';
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(toast);
      return acc;
    },
    {} as Record<string, ToastData[]>,
  );

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          className={clsx(
            'fixed z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none',
            getPositionClasses(position),
          )}
        >
          {positionToasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast toast={toast} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
