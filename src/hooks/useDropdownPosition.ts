import { debounce, isScrollableElement } from '@/utils';
import { useState, useCallback, useEffect } from 'react';

export const useDropdownPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  position: 'bottom' | 'top' | 'auto',
  maxHeight: string,
  usePortal: boolean,
) => {
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 });

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let finalPosition: 'bottom' | 'top' = 'bottom';
    if (position === 'auto') {
      finalPosition =
        spaceBelow < parseInt(maxHeight) + 20 && spaceAbove > spaceBelow ? 'top' : 'bottom';
    } else {
      finalPosition = position as 'bottom' | 'top';
    }

    setDropdownPosition(finalPosition);

    if (usePortal) {
      setDropdownRect({
        top:
          finalPosition === 'bottom'
            ? rect.bottom + window.scrollY + 4
            : rect.top + window.scrollY - 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [triggerRef, position, usePortal, maxHeight]);

  const debouncedCalculatePosition = useCallback(() => {
    debounce(calculatePosition, 100)();
  }, [calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    calculatePosition();

    const handleReposition = () => debouncedCalculatePosition();

    window.addEventListener('scroll', handleReposition, { passive: true });
    window.addEventListener('resize', handleReposition);

    // Add scroll listeners to scrollable parents
    if (triggerRef.current) {
      let parent = triggerRef.current.parentElement;
      const scrollableParents: Element[] = [];

      while (parent && parent !== document.body) {
        if (isScrollableElement(parent)) {
          scrollableParents.push(parent);
          parent.addEventListener('scroll', handleReposition, { passive: true });
        }
        parent = parent.parentElement;
      }

      return () => {
        window.removeEventListener('scroll', handleReposition);
        window.removeEventListener('resize', handleReposition);
        scrollableParents.forEach(p => p.removeEventListener('scroll', handleReposition));
      };
    }
  }, [isOpen, calculatePosition, debouncedCalculatePosition, triggerRef]);

  return { dropdownPosition, dropdownRect, calculatePosition };
};
