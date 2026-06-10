import { useMapUIStore, setProductEnabledByProduct } from '@/store';
import { cn } from '@/utils';
import { useShallow } from 'zustand/shallow';
import { Button } from '../Button';
import { CloseIcon } from '../Icons';
import type { IconProps } from '../Icons';
import type { ProductType } from '@/constants';

type LayersIndicatorProps = {
  layers: {
    Icon: React.ComponentType<IconProps>;
    product: ProductType;
  }[];
  className?: string;
};

export function LayersIndicator({ layers, className }: LayersIndicatorProps) {
  const { productEnabled } = useMapUIStore(
    useShallow(s => ({
      productEnabled: s.productEnabled,
    })),
  );

  const handleClick = (product: ProductType) => () => {
    setProductEnabledByProduct(product, false);
  };

  return (
    <div className={cn('flex flex-col gap-y-4', className)}>
      {layers.map(({ Icon, product }) => {
        return (
          <Button
            key={'LayersIndicator-' + product}
            aria-label={'close' + product}
            className={cn('relative h-10 w-10 rounded bg-white flex justify-center items-center', {
              hidden: !productEnabled[product],
            })}
            onClick={handleClick(product)}
          >
            <Icon size="lg" />
            <CloseIcon
              size="xs"
              color="imos-red"
              className="absolute right-0 top-0 border rounded-4xl"
            />
          </Button>
        );
      })}
    </div>
  );
}
