import { useState, useRef, useCallback, useEffect } from 'react';
import { DragHandle } from '../type';
import { TIMING } from '../constants';

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
    if (pendingFocus && lastInteractionType === 'mouse') {
      const focusTarget =
        pendingFocus === 'start'
          ? startHandleRef.current
          : pendingFocus === 'end'
            ? endHandleRef.current
            : pendingFocus === 'point'
              ? pointHandleRef.current
              : null;

      if (focusTarget && document.activeElement !== focusTarget) {
        setTimeout(() => {
          focusTarget.focus();
        }, TIMING.FOCUS_DELAY);
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
