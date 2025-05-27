import { ReactNode } from 'react';

export type CollapsibleComponentProps = {
  maxHeight?: number;
  open: boolean;
  trigger: ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
  direction?: 'down' | 'up';
};

export const CollapsibleComponent = ({
  maxHeight = 800,
  open,
  trigger,
  children,
  wrapperClassName = '',
  direction = 'down',
}: CollapsibleComponentProps) => {
  const isUpward = direction === 'up';

  return (
    <div className={wrapperClassName}>
      {isUpward && (
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: open ? `${maxHeight}px` : 0,
            transform: open ? 'translateY(0)' : `translateY(100%)`,
          }}
          data-state={open ? 'open' : 'closed'}
        >
          <div>{children}</div>
        </div>
      )}

      <div>{trigger}</div>

      {!isUpward && (
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: open ? `${maxHeight}px` : 0,
          }}
          data-state={open ? 'open' : 'closed'}
        >
          <div>{children}</div>
        </div>
      )}
    </div>
  );
};
