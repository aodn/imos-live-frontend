import { cn } from '@/utils';
import { memo } from 'react';
import { createPortal } from 'react-dom';
import { useDateLabelPersist } from '../hooks';
import type { DateLabelProps } from '../type';

export const DateLabel = memo(
  ({
    position,
    label,
    visible = true,
    immediateDisappear,
    handleLabelPersistent,
    handleLabelDisabled,
    renderDateLabel,
    className,
  }: DateLabelProps) => {
    // showDateLabel only works when handleLabelPersistent is false
    const { showDateLabel } = useDateLabelPersist(
      immediateDisappear || false,
      label,
      handleLabelPersistent || false,
    );

    if (
      !position ||
      !label ||
      !renderDateLabel ||
      handleLabelDisabled ||
      !visible ||
      (!showDateLabel && !handleLabelPersistent)
    )
      return null;

    return createPortal(
      <div
        style={{ left: position.x, top: position.y }}
        className={cn('fixed transform -translate-x-1/2 pointer-events-none', className)}
        role="tooltip"
        aria-live="polite"
      >
        {renderDateLabel({ label })}
      </div>,
      document.body,
    );
  },
);

DateLabel.displayName = 'DateLabel';
