import { cn } from '@/utils';
import { ArrowDownIcon, Button, DragIndicatorIcon, IconProps } from '..';

export type CollapsibleTriggerProps = {
  dragHandleClass: string;
  open: boolean;
  toggle: () => void;
  clasName?: string;
  FirstIcon?: React.FC<IconProps>;
  SecondIcon?: React.FC<IconProps>;
  toggleIconHidden?: boolean;
};

export const CollapsibleTrigger = ({
  open,
  toggle,
  dragHandleClass,
  clasName,
  FirstIcon,
  SecondIcon,
  toggleIconHidden = false,
}: CollapsibleTriggerProps) => {
  return (
    <div
      className={cn(
        'w-full min-h-10 flex items-center relative cursor-grab bg-[rgba(35,55,75,1)] active:bg-[rgba(35,55,75,0.9)] ',
        dragHandleClass,
        clasName,
      )}
    >
      {!toggleIconHidden && (
        <Button variant="ghost" size="icon" className="hover:bg-transparent " onClick={toggle}>
          {FirstIcon ? (
            <FirstIcon
              color="imos-white"
              className={cn('transition-transform duration-300', open && 'rotate-180')}
            />
          ) : (
            <ArrowDownIcon
              color="imos-white"
              className={cn('transition-transform duration-300', open && 'rotate-180')}
            />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2  hover:bg-transparent cursor-grab',
        )}
      >
        {SecondIcon ? (
          <SecondIcon color="imos-white" size="xl" className="rotate-180" />
        ) : (
          <DragIndicatorIcon color="imos-white" size="xl" className="rotate-180" />
        )}
      </Button>
    </div>
  );
};
