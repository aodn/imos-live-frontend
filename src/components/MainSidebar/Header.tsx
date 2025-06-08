import { getScaledDimensions } from '@/utils';
import { cn } from '@/utils';
import { HeaderData } from './MainSidebarContent';
import { Image } from '../Image';

export type HeaderProps = {
  className?: string;
} & HeaderData;

export const Header = ({ image, title, className }: HeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-x-4 py-4 -mx-4 shadow-lg  border-b border-gray-200',
        className,
      )}
    >
      <div className="border-r-2 flex-1 flex items-center justify-center">
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
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-imos-grey font-bold">{title}</h1>
      </div>
    </div>
  );
};
