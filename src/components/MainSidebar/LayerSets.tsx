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
          <div key={dataset.layerId}>
            <LayerCard
              image={dataset.image}
              title={dataset.title}
              description={dataset.description}
              addToMap={dataset.addToMap}
              firstButtonLabel="Add to map"
              secondButtonLabel="Remove from map"
              layerId={dataset.layerId}
              visible={dataset.visible}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
