import { LayerCard } from './LayerCard';
import { LayersDataset } from './MainSidebarContent';

type LayerSetsProps = {
  className?: string;
  title: string;
  layersDatasets: LayersDataset[];
  date: string;
};

export const LayerSets = ({ layersDatasets, title, className, date }: LayerSetsProps) => {
  return (
    <div className={className}>
      <h2 className="text-lg font-bold hidden md:block">{title}</h2>
      <div className="flex flex-col gap-y-4  mt-4">
        {layersDatasets.map(product => (
          <div key={product.layerId} aria-label={`${product.title} product`}>
            <LayerCard
              {...product}
              firstButtonLabel="Add to map"
              secondButtonLabel="Remove from map"
              date={date}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
