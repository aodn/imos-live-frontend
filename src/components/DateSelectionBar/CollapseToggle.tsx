import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '@/utils';

type CollapseToggleProps = {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
};

export function CollapseToggle({ collapsed, onToggle, className }: CollapseToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand date slider' : 'Shrink date slider'}
      aria-expanded={!collapsed}
      className={cn(
        'frosted h-16 w-fit self-stretch rounded-l-none rounded-r-lg hover:bg-white/30 hover:opacity-100 border-imos-black/70',
        className,
      )}
    >
      {collapsed ? (
        <ChevronsRight className="size-5 text-imos-black" />
      ) : (
        <ChevronsLeft className="size-5 text-imos-black" />
      )}
    </Button>
  );
}
