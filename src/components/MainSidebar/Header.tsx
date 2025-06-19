import { getScaledDimensions, cn } from '@/utils';
import { HeaderData } from './MainSidebarContent';
import { Image } from '../Image';
import { Button } from '../Button';
import { MenuIcon } from '../Icons';
import { useDrawerStore } from '@/store';
import { useCallback } from 'react';
import { MainSidebarContent } from './MainSidebarContent';

export type HeaderProps = {
  className?: string;
} & HeaderData;

export const Header = ({ image, title, className }: HeaderProps) => {
  const openLeftDrawer = useDrawerStore(s => s.openLeftDrawer);
  const handleClick = useCallback(() => {
    openLeftDrawer(<MainSidebarContent />);
  }, [openLeftDrawer]);
  return (
    <div
      className={cn(
        'flex items-center gap-x-4 px-8 py-2 md:py-4 -mx-4 shadow-lg  border-b border-gray-200',
        className,
      )}
    >
      <div className="border-r-2 flex-1 flex items-center md:justify-center justify-between">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={handleClick}>
          <MenuIcon size="xl" />
        </Button>
        <Image
          src={image.src}
          alt={image.alt || 'imos logo'}
          height={50}
          width={
            getScaledDimensions({
              by: 'height',
              value: 50,
              intrinsicHeight: image.height || 63,
              intrinsicWidth: image.width || 147,
            }).width
          }
        />
      </div>
      <div className="flex-1">
        <h1 className="text-imos-grey font-bold text-left md:text-center">{title}</h1>
      </div>
    </div>
  );
};
