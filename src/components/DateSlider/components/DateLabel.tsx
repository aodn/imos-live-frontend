import { cn } from '@/utils';
import { memo } from 'react';
import { createPortal } from 'react-dom';
import { useDateLabelPersist } from '../hooks';
import { DateLabelProps } from '../type';

export const DateLabel = memo(
  ({
    position,
    label,
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

    if (!position || !label || !renderDateLabel || handleLabelDisabled) return null;
    if (!handleLabelPersistent && !showDateLabel) return;

    return createPortal(
      <div
        style={{ left: position.x, top: position.y }}
        className={cn('fixed z-50 transform -translate-x-1/2 pointer-events-none', className)}
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
