import { cn } from '@/utils';
import { ArrowDownIcon, Button, DragIndicatorIcon, IconProps, LayersIcon } from '..';

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
        'w-full min-h-10 flex items-center relative cursor-grab h-12 md:h-auto',
        dragHandleClass,
        clasName,
      )}
    >
      {!toggleIconHidden && (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-transparent hidden md:block"
          onClick={toggle}
        >
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

      <>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2  hover:bg-transparent cursor-grab',
          )}
        >
          {SecondIcon ? (
            <SecondIcon color="imos-white" size="xl" className="md:rotate-180" />
          ) : (
            <DragIndicatorIcon color="imos-white" size="xl" className="rotate-180" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'md:hidden absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2  hover:bg-transparent cursor-grab',
          )}
          onClick={toggle}
        >
          {SecondIcon ? (
            <SecondIcon color="imos-white" size="xl" className="md:rotate-180" />
          ) : (
            <LayersIcon color="imos-grey" size="xl" />
          )}
        </Button>
      </>
    </div>
  );
};
