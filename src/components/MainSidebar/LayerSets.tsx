import { LayerCard } from './LayerCard';
import type { LayersDataset } from './MainSidebarContent';

type LayerSetsProps = {
  className?: string;
  title: string;
  layersDatasets: LayersDataset[];
};

export function LayerSets({ layersDatasets, title, className }: LayerSetsProps) {
  return (
    <div className={className}>
      <h2 className="text-title-md hidden md:block">{title}</h2>
      <div className="flex flex-col gap-y-4  mt-4">
        {layersDatasets.map(product => (
          <div key={product.layerId} aria-label={`${product.title} product`}>
            <LayerCard {...product} />
          </div>
        ))}
      </div>
    </div>
  );
}
