import { ReactNode } from 'react';
import { Button, CollapsibleComponent } from '../ui';
import { ArrowDownIcon, DragIndicatorIcon } from '../Icons';
import { useToggle } from '@/hooks/useToggle';
import clsx from 'clsx';

type MenuProps = {
  children: ReactNode;
};

export const Menu = ({ children }: MenuProps) => {
  const { open, toggle } = useToggle(false);
  return (
    <CollapsibleComponent
      wrapperClassName="bg-[rgba(35,55,75,0.9)] text-[#ddd] font-mono rounded"
      open={open}
      trigger={
        <div className="flex">
          <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={toggle}>
            <ArrowDownIcon
              color="imos-white"
              className={clsx('transition-transform duration-300', open && 'rotate-180')}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-1 imos-drag-handle hover:bg-transparent"
          >
            <DragIndicatorIcon color="imos-white" className="rotate-180" />
          </Button>
        </div>
      }
      children={<div className="bg-imos-black">{children}</div>}
    />
  );
};
