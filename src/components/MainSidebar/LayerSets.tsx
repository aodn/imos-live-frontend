import { LayerCard } from './LayerCard';
import { LayersDataset } from './MainSidebarContent';

type LayerSetsProps = {
  className?: string;
  title: string;
  layersDatasets: LayersDataset[];
};

export const LayerSets = ({ layersDatasets, title, className }: LayerSetsProps) => {
  return (
    <div className={className}>
      <h2 className="text-lg font-bold hidden md:block">{title}</h2>
      <div className="flex flex-col gap-y-4  mt-4">
        {layersDatasets.map(dataset => (
          <div key={dataset.layerId} aria-label={`${dataset.title} product`}>
            <LayerCard
              {...dataset}
              firstButtonLabel="Add to map"
              secondButtonLabel="Remove from map"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
