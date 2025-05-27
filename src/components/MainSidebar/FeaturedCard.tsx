import { Button } from '../Button';
import { MapLayersIcon } from '../Icons';
import { FeaturedDataset } from './MainSidebarContent';

export type FeaturedCardProps = FeaturedDataset;

export const FeaturedCard = ({ image, title, description, addToMap }: FeaturedCardProps) => {
  return (
    <div className="flex gap-x-6 p-4 rounded-lg shadow-lg bg-white border border-gray-300 overflow-hidden">
      <div className="flex-1 min-w-30 rounded-lg overflow-hidden aspect-square">
        <img alt={image.alt} src={image.src} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1  flex flex-col justify-between">
        <div>
          <h3 className={`font-semibold mb-2`}>{title}</h3>
          <p className={`text-sm mb-3 leading-relaxed`}>{description}</p>
        </div>

        <Button variant={'outline'} onClick={addToMap} className="self-end">
          <MapLayersIcon />
          Add to map
        </Button>
      </div>
    </div>
  );
};
