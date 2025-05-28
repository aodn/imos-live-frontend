import { Button } from '../Button';
import { MapLayersIcon } from '../Icons';
import { Image } from '../Image';
import { LayersDataset } from './MainSidebarContent';

export type LayerCardProps = LayersDataset & {
  firstButtonLabel: string;
  secondButtonLabel: string;
};

export const LayerCard = ({
  image,
  title,
  description,
  firstButtonLabel,
  secondButtonLabel,
  addToMap,
  visible,
}: LayerCardProps) => {
  const handleClick = () => {
    if (visible) addToMap(false);
    else addToMap(true);
  };
  return (
    <div className="flex gap-x-6 p-4 rounded-lg shadow-lg bg-white border border-gray-300 overflow-hidden">
      <div className="flex-1 min-w-30 rounded-lg overflow-hidden aspect-square">
        <Image alt={image.alt} src={image.src} fill imageClassName="object-cover" />
      </div>
      <div className="flex-1  flex flex-col justify-between">
        <div>
          <h3 className={`font-semibold mb-2`}>{title}</h3>
          <p className={`text-sm mb-3 leading-relaxed`}>{description}</p>
        </div>

        {!visible && (
          <Button variant={'outline'} onClick={handleClick} className="self-end">
            <MapLayersIcon />
            {firstButtonLabel}
          </Button>
        )}
        {visible && (
          <Button variant={'outline'} onClick={handleClick} className="self-end">
            <MapLayersIcon />
            {secondButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
