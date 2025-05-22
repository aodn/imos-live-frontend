import { useRef, ReactNode, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import mergeRefs from 'merge-refs';

type Props = {
  variant?: 'fixed' | 'measured';
  open: boolean;
  trigger: ReactNode;
  children: ReactNode;
  wrapperClassName?: string;
  ref?: React.RefObject<HTMLDivElement | null>;
};

export const CollapsibleComponent = ({
  variant = 'fixed',
  open,
  trigger,
  children,
  wrapperClassName = '',
  ref,
}: Props) => {
  const [height, setHeight] = useState(0);
  const localRef = useRef<HTMLDivElement>(null);
  const animationClassName = 'transition-all duration-300 ease-in-out';

  useLayoutEffect(() => {
    if (variant === 'fixed') return;
    if (open && localRef.current) {
      setHeight(localRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open, children, variant]);

  return (
    <div className={wrapperClassName}>
      <div>{trigger}</div>
      <div
        className={clsx('overflow-hidden', animationClassName)}
        style={
          variant == 'fixed' ? { maxHeight: open ? '800px' : 0 } : { height: open ? height : 0 }
        }
        data-state={open ? 'open' : 'closed'}
      >
        <div ref={ref ? mergeRefs(localRef, ref) : localRef}>{children}</div>
      </div>
    </div>
  );
};
