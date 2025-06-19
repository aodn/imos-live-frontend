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
  return (
    <div className={className}>
      <CollapsibleComponent
        isWidthFiexed
        wrapperClassName="border rounded-lg shadow-lg"
        direction="up"
        trigger={({ open, toggle, direction }) => (
          <LayerProductsCollapsibleTrigger
            title={title}
            open={open}
            onToggle={toggle}
            direction={direction}
          />
        )}
      >
        {<LayerProductsContent className="py-2" products={products} />}
      </CollapsibleComponent>
    </div>
  );
};
