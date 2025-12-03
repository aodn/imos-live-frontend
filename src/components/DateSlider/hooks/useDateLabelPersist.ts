import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook to manage the persistence of the date label display, date label will
 * appear for a short duration when triggered unless immediateDisappear is true.
 * This only applies when handleLabelPersistent is false.
 * @param handleLabelPersistent
 * @param immediateDisappear
 * @param label
 * @returns { showDateLabel: boolean }
 */
export const useDateLabelPersist = (
  immediateDisappear: boolean,
  label: string | undefined,
  handleLabelPersistent: boolean,
) => {
  const [showDateLabel, setShowDateLabel] = useState(false);
  const enableTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disableTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (handleLabelPersistent) return;

    if (immediateDisappear) {
      setShowDateLabel(false);
      if (disableTimeoutId.current) clearTimeout(disableTimeoutId.current);
      if (enableTimeoutId.current) clearTimeout(enableTimeoutId.current);
      return;
    }
  }, [immediateDisappear, handleLabelPersistent]);

  useEffect(() => {
    if (handleLabelPersistent) return;

    if (label !== undefined) {
      enableTimeoutId.current = setTimeout(() => {
        setShowDateLabel(true);
      }, 100);

      disableTimeoutId.current = setTimeout(() => {
        setShowDateLabel(false);
      }, 1500);
    } else {
      setShowDateLabel(false);
    }
    return () => {
      setShowDateLabel(false);
      if (disableTimeoutId.current) clearTimeout(disableTimeoutId.current);
      if (enableTimeoutId.current) clearTimeout(enableTimeoutId.current);
    };
  }, [label, handleLabelPersistent]);

  return { showDateLabel };
};
