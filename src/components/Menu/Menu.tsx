import { ReactNode } from 'react';
import { Button } from '../Button';
import { CollapsibleComponent } from '../Collapsible';
import { ArrowDownIcon, DragIndicatorIcon } from '../Icons';
import { cn } from '@/lib/utils';

type MenuProps = {
  children: ReactNode;
};

export const Menu = ({ children }: MenuProps) => {
  return (
    <CollapsibleComponent
      wrapperClassName="bg-[rgba(35,55,75,0.9)] text-[#ddd] font-mono rounded"
      trigger={({ open, toggle }) => (
        <div className="flex">
          <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={toggle}>
            <ArrowDownIcon
              color="imos-white"
              className={cn('transition-transform duration-300', open && 'rotate-180')}
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
      )}
      children={<div className="bg-imos-black">{children}</div>}
    />
  );
};
