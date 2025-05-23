import { cn } from '@/lib/utils';
import { ArrowDownIcon, Button, DragIndicatorIcon } from '..';

export type CollapsibleTriggerProps = {
  dragHandleClass: string;
  open: boolean;
  toggle: () => void;
};

export const CollapsibleTrigger = ({ open, toggle, dragHandleClass }: CollapsibleTriggerProps) => {
  return (
    <div className="flex items-center relative bg-[rgba(35,55,75,1)] active:bg-[rgba(35,55,75,0.9)]">
      <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={toggle}>
        <ArrowDownIcon
          color="imos-white"
          className={cn('transition-transform duration-300', open && 'rotate-180')}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2  hover:bg-transparent',
          dragHandleClass,
        )}
      >
        <DragIndicatorIcon color="imos-white" size="xl" className="rotate-180" />
      </Button>
    </div>
  );
};
