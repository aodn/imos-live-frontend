import React, { useState } from 'react';
import { Button } from '../ui';
import { CloseIcon, MenuIcon } from '../Icons';
import { cn } from '@/lib/utils';

type SidebarProps = {
  width?: number;
  sidebarContent?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  wrapperClassName?: string;
  openButtonClassName?: string;
  closeButtonClassName?: string;
  openButtonContent?: React.ReactNode;
  closeButtonContent?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  width = 540,
  sidebarContent,
  children,
  defaultOpen = true,
  wrapperClassName = '',
  openButtonClassName = '',
  closeButtonClassName = '',
  closeButtonContent,
  openButtonContent,
  onOpen,
  onClose,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const handleOpen = () => {
    setOpen(true);
    if (onOpen) onOpen();
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <aside
        className={cn(
          'relative h-full bg-gray-900 text-white shadow-lg z-10 overflow-hidden transition-width duration-300 ease-in-out',
          wrapperClassName,
        )}
        style={{
          width: open ? width : 0,
        }}
        inert={!open}
      >
        <Button
          variant="ghost"
          aria-label="Close sidebar"
          size="icon"
          onClick={handleClose}
          tabIndex={open ? 0 : -1}
          className={cn('absolute top-2 right-2', closeButtonClassName)}
        >
          {closeButtonContent || <CloseIcon size="xl" />}
        </Button>

        <div className="p-6">{sidebarContent}</div>
      </aside>

      {!open && (
        <Button
          variant="ghost"
          aria-label="Open sidebar"
          size="icon"
          onClick={handleOpen}
          className={cn('absolute z-20 left-4 top-4', openButtonClassName)}
        >
          {openButtonContent || <MenuIcon size="xl" />}
        </Button>
      )}

      <div className="flex-1 h-full">{children}</div>
    </div>
  );
};
