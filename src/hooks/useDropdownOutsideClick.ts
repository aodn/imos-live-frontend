import { useEffect } from 'react';

export const useDropdownOutsideClick = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  portalDropdownRef: React.RefObject<HTMLDivElement | null>,
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  usePortal: boolean,
  onClose: () => void,
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);

      if (usePortal) {
        const isOutsidePortalDropdown =
          portalDropdownRef.current && !portalDropdownRef.current.contains(target);
        if (isOutsideTrigger && isOutsidePortalDropdown) {
          onClose();
        }
      } else {
        const isOutsideDropdownContainer =
          dropdownRef.current && !dropdownRef.current.contains(target);
        if (isOutsideDropdownContainer) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, usePortal, triggerRef, portalDropdownRef, dropdownRef, onClose]);
};
