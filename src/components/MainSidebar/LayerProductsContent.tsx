import { Button } from '../Button';
import { cn } from '@/lib/utils';
import { LayerProducts as LayerProductsType } from './MainSidebarContent';

export type LayerProductsContentProps = {
  products: LayerProductsType;
  className?: string;
};

export const LayerProductsContent = ({ products, className }: LayerProductsContentProps) => {
  return (
    <div className={cn('w-full flex flex-col gap-y-4', className)}>
      {products.map(({ label, Icon, fn }, index) => (
        <Button
          variant="ghost"
          key={label + index}
          data-testid={`layer-product-${label}`}
          className="w-full gap-x-8 text-2xl py-6 justify-start"
          onClick={fn}
        >
          {Icon && <Icon size="xl" />}
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
};
