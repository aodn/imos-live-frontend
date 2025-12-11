import { useEffect, useRef } from 'react';

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs?: number,
): void;

export function useResizeObserver<T extends HTMLElement>(
  ref: T | null,
  callback: () => void,
  debounceMs?: number,
): void;

export function useResizeObserver(
  ref: 'window',
  callback: (entry: { width: number; height: number }) => void,
  debounceMs?: number,
): void;

// Additional overload for union types (window | element | null)
export function useResizeObserver<T extends HTMLElement>(
  ref: 'window' | T | null,
  callback: ((entry: { width: number; height: number }) => void) | (() => void),
  debounceMs?: number,
): void;

// Implementation
export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null> | 'window' | T | null,
  callback:
    | ((entry: ResizeObserverEntry) => void)
    | ((entry: { width: number; height: number }) => void)
    | (() => void),
  debounceMs: number = 200,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Handle window resize
    if (ref === 'window') {
      const handleResize = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          (callback as (entry: { width: number; height: number }) => void)({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }, debounceMs);
      };

      window.addEventListener('resize', handleResize);
      // Call immediately to get initial dimensions
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    // Handle RefObject case
    if (ref && typeof ref === 'object' && 'current' in ref) {
      if (!ref.current) return;
      const element = ref.current;

      const observer = new ResizeObserver(entries => {
        if (!entries[0]) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          (callback as (entry: ResizeObserverEntry) => void)(entries[0]);
        }, debounceMs);
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    // Handle direct HTMLElement case
    if (ref instanceof HTMLElement) {
      const element = ref;

      const observer = new ResizeObserver(entries => {
        if (!entries[0]) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          (callback as () => void)();
        }, debounceMs);
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    // ref is null - do nothing
  }, [ref, callback, debounceMs]);
}
