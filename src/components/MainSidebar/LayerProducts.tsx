import { useToggle } from '@/hooks';
import { CollapsibleComponent } from '..';
import { LayerProductsCollapsibleTrigger } from './LayerProductsCollapsibleTrigger';
import { LayerProductsContent } from './LayerProductsContent';
import { LayerProducts as LayerProductsType } from './MainSidebarContent';

type LayerProductsProps = {
  products: LayerProductsType;
  className?: string;
  title: string;
};

export const LayerProducts = ({ products, className, title }: LayerProductsProps) => {
  const { open, toggle } = useToggle(false);

  return (
    <div className={className}>
      <CollapsibleComponent
        wrapperClassName="border rounded-lg shadow-lg"
        direction="up"
        open={open}
        trigger={
          <LayerProductsCollapsibleTrigger
            title={title}
            open={open}
            onToggle={toggle}
            direction="up"
          />
        }
      >
        {<LayerProductsContent className="px-4 py-2" products={products} />}
      </CollapsibleComponent>
    </div>
  );
};
