import { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  maxHeight?: number;
  open: boolean;
  trigger: ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
};

export const CollapsibleComponent = ({
  maxHeight = 800,
  open,
  trigger,
  children,
  wrapperClassName = '',
}: Props) => {
  const animationClassName = 'transition-all duration-300 ease-in-out';

  return (
    <div className={wrapperClassName}>
      <div>{trigger}</div>
      <div
        className={clsx('overflow-hidden', animationClassName)}
        style={{ maxHeight: open ? `${maxHeight}px` : 0 }}
        data-state={open ? 'open' : 'closed'}
      >
        <div>{children}</div>
      </div>
    </div>
  );
};
