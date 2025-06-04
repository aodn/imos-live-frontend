import { useToggle } from '@/hooks';
import { ReactNode } from 'react';

export type CollapsibleComponentProps = {
  maxHeight?: number;
  trigger: (props: { toggle: () => void; open: boolean; direction: 'up' | 'down' }) => ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
  direction?: 'down' | 'up';
  defaultOpen?: boolean;
};

export const CollapsibleComponent = ({
  maxHeight = 800,
  trigger,
  children,
  wrapperClassName = '',
  direction = 'down',
  defaultOpen = false,
}: CollapsibleComponentProps) => {
  const isUpward = direction === 'up';
  const { open, toggle } = useToggle(defaultOpen);

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

      <div>{trigger({ toggle, open, direction })}</div>

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
