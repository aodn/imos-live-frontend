import { TIMING } from '../constants';
import type { DragHandle } from '../type';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage focus state for slider handles.
 *
 * Handles programmatic focusing of handles after user interactions,
 * with different behavior for mouse vs keyboard interactions.
 * Uses a small delay for mouse interactions to ensure DOM updates complete.
 *
 * @returns Focus management utilities and handle refs
 */
export function useFocusManagement() {
  const [pendingFocus, setPendingFocus] = useState<DragHandle>(null);
  const [lastInteractionType, setLastInteractionType] = useState<'mouse' | 'keyboard' | null>(null);

  const startHandleRef = useRef<HTMLButtonElement>(null);
  const endHandleRef = useRef<HTMLButtonElement>(null);
  const pointHandleRef = useRef<HTMLButtonElement>(null);

  const requestHandleFocus = useCallback(
    (handleType: DragHandle, interactionType: 'mouse' | 'keyboard' = 'keyboard') => {
      setLastInteractionType(interactionType);
      setPendingFocus(handleType);
    },
    [],
  );

  // Handle focus management after renders
  useEffect(() => {
    const handleMap = {
      start: startHandleRef.current,
      end: endHandleRef.current,
      point: pointHandleRef.current,
    } as const;

    if (pendingFocus) {
      const focusTarget = pendingFocus ? handleMap[pendingFocus] : null;

      if (focusTarget && document.activeElement !== focusTarget) {
        // Use delay for mouse interactions to ensure DOM updates complete
        // For keyboard/programmatic focus, apply immediately
        const delay = lastInteractionType === 'mouse' ? TIMING.FOCUS_DELAY : 0;
        setTimeout(() => {
          focusTarget.focus();
        }, delay);
      }
      setPendingFocus(null);
    }
  }, [pendingFocus, lastInteractionType]);

  const handleHandleFocus = useCallback(() => {
    if (lastInteractionType !== 'keyboard') {
      setLastInteractionType('keyboard');
    }
  }, [lastInteractionType]);

  return {
    requestHandleFocus,
    handleHandleFocus,
    setLastInteractionType,
    startHandleRef,
    endHandleRef,
    pointHandleRef,
  };
}
