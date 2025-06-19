import React, { useState } from 'react';
import { Button } from '../Button';
import { CloseIcon, MenuIcon } from '../Icons';
import { cn } from '@/utils';

type SidebarProps = {
  width?: number;
  sidebarContent?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  wrapperClassName?: string;
  className?: string;
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
  className = '',
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
    <div className={cn('flex relative  h-full w-full  overflow-hidden', className)}>
      <aside
        className={cn(
          'relative h-full  shadow-lg z-10 overflow-y-auto transition-width duration-100 ease-in-out',
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

        <div className="px-4">{sidebarContent}</div>
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

      <div className="flex-1 h-full relative">{children}</div>
    </div>
  );
};
