import { cn } from '@/utils';
import { useSidebarStore } from '@/store';

type SidebarProps = {
  width?: number;
  sidebarContent?: React.ReactNode;
  children?: React.ReactNode;
  wrapperClassName?: string;
  className?: string;
};

export const Sidebar: React.FC<SidebarProps> = ({
  width = 540,
  sidebarContent,
  children,
  wrapperClassName = '',
  className = '',
}) => {
  const isOpen = useSidebarStore(s => s.isOpen);

  return (
    <div className={cn('flex relative  h-full w-full  overflow-hidden', className)}>
      <aside
        className={cn(
          'relative h-full  shadow-lg z-10 overflow-y-auto transition-width duration-100 ease-in-out',
          wrapperClassName,
        )}
        style={{
          width: isOpen ? width : 0,
        }}
        inert={!isOpen}
      >
        <div className="px-4">{sidebarContent}</div>
      </aside>

      <div className="flex-1 h-full relative">{children}</div>
    </div>
  );
};
