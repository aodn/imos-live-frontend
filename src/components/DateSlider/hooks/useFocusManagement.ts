import { useState, useRef, useCallback, useEffect } from 'react';
import { DragHandle } from '../type';

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
        }, 50);
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
