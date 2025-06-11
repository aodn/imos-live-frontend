import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(0);
  const animationStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef(0);
  const wasPausedRef = useRef(false);

  // Memoize duration to safely use it in dependency arrays
  const duration = useMemo(() => toast.duration || 5000, [toast.duration]);

  const handleClose = useCallback(() => {
    toast.onClose?.();
    hideToast(toast.id);
  }, [toast, hideToast]);

  const handleClick = useCallback(() => {
    toast.onClick?.();
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

  useEffect(() => {
    if (toast.persistent || duration === 0 || toast.showProgressBar === false) {
      return;
    }

    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    // --- PAUSE LOGIC ---
    if (isPaused) {
      wasPausedRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(animationFrameRef.current);

      const elapsed = Date.now() - animationStartTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

      const remainingPercent = (remainingTimeRef.current / duration) * 100;
      progressBar.style.transition = 'none';
      progressBar.style.width = `${remainingPercent}%`;
    }
    // --- START / RESUME LOGIC ---
    else {
      // If NOT resuming from a pause, it's a fresh start or a duration change. Reset the timer.
      if (!wasPausedRef.current) {
        remainingTimeRef.current = duration;
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
      }

      animationStartTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(handleClose, remainingTimeRef.current);

      // We need a layout repaint before the transition starts to avoid the animation bug
      animationFrameRef.current = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.transition = `width ${remainingTimeRef.current}ms linear`;
          progressBar.style.width = '0%';
        });
      });

      wasPausedRef.current = false;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPaused, duration, toast.persistent, toast.showProgressBar, handleClose]);

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

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/50';
      case 'error':
        return 'bg-red-500/50';
      case 'warning':
        return 'bg-yellow-500/50';
      case 'info':
        return 'bg-blue-500/50';
      default:
        return 'bg-gray-500/50';
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
      {toast.showProgressBar !== false && !toast.persistent && duration !== 0 && (
        <div
          className="absolute inset-0 h-full bg-black/10 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            ref={progressBarRef}
            className={clsx(
              'h-full will-change-transform',
              getProgressBarColor(),
              toast.progressBarClassName,
            )}
            style={{
              width: '100%',
              transformOrigin: 'left center',
            }}
          />
        </div>
      )}

      <div className={clsx('flex-shrink-0 mt-0.5', getIconColorClass(), toast.iconClassName)}>
        {toast.renderIcon ? toast.renderIcon() : getDefaultIcon()}
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={clsx('font-semibold text-sm mb-1', toast.titleClassName)}>
            {toast.title}
          </h4>
        )}
        <p className={clsx('text-xs leading-relaxed', toast.messageClassName)}>{toast.message}</p>
      </div>

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

// --- ToastContainer remains the same ---
export const ToastContainer: React.FC<{ toasts: ToastData[] }> = ({ toasts }) => {
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
