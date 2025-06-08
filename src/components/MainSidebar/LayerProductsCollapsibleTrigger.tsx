import { Button } from '../Button';
import { ArrowDownIcon, WidgetsIcon } from '../Icons';
import { cn } from '@/utils';

export const LayerProductsCollapsibleTrigger = ({
  open,
  onToggle,
  direction = 'down',
  title,
}: {
  open: boolean;
  onToggle: () => void;
  direction?: 'up' | 'down';
  title: string;
}) => {
  const shouldRotate = direction === 'down' ? open : !open;

  return (
    <Button
      size="icon"
      className="justify-between px-4 py-8 w-full rounded-t-none rounded-b-lg"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`${open ? 'Collapse' : 'Expand'} content`}
    >
      <WidgetsIcon color="imos-white" size="xl" />
      <span>{title}</span>
      <ArrowDownIcon
        color="imos-white"
        size="xl"
        className={cn(
          'transition-transform duration-300 ease-in-out',
          shouldRotate && 'rotate-180',
        )}
      />
    </Button>
  );
};
