import { WAVE_BUOYS_LAYER_ID } from '@/constants';
import { Button } from '../Button';
import { ArrowDownIcon, MapLayersIcon } from '../Icons';
import { Image } from '../Image';
import { LayersDataset } from './MainSidebarContent';
import { CollapsibleComponent, TriggerArgs } from '../Collapsible';
import { cn } from '@/utils';
import { useViewportSize } from '@/hooks';
import { ReactNode } from 'react';

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
  layerId,
  icon,
}: LayerCardProps) => {
  const { widthBreakpoint } = useViewportSize();
  const isMobileOrTablet = ['sm', 'md'].includes(widthBreakpoint || '');

  const handleClick = () => {
    if (visible) addToMap(false);
    else addToMap(true);
    if (layerId === WAVE_BUOYS_LAYER_ID) import('../Highcharts/WaveBuoyChart'); //preload wavebuoy chart when wavebuoylayer added.
  };
  return (
    <>
      <CollapsibleComponent
        wrapperClassName="md:rounded-lg md:shadow-lg bg-white md:border border-b border-gray-300"
        defaultOpen
        isWidthFiexed
        trigger={({ toggle, open, direction, toggleIconHidden }: TriggerArgs) => (
          <CardTrigger
            icon={icon}
            title={title}
            open={open}
            toggle={toggle}
            direction={direction}
            toggleIconHidden={toggleIconHidden}
          />
        )}
        disable={!isMobileOrTablet}
      >
        <div className="flex flex-col md:flex-row md:p-4 pb-4 gap-y-4 md:gap-y-0 md:gap-x-6  overflow-hidden">
          <div className="flex-1 min-w-30 rounded-lg overflow-hidden aspect-square">
            <Image alt={image.alt} src={image.src} fill imageClassName="object-cover" />
          </div>
          <div className="flex-1  flex flex-col justify-between">
            <div>
              <h3 className="font-semibold mb-2 hidden md:block">{title}</h3>
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
      </CollapsibleComponent>
    </>
  );
};

const CardTrigger = ({
  open,
  toggle,
  direction = 'down',
  toggleIconHidden = false,
  title,
  icon,
}: TriggerArgs & { title: string; icon: ReactNode }) => {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex  gap-x-4">
          {icon}
          <h3 className={`font-semibold mb-2`}>{title}</h3>
        </div>
        {!toggleIconHidden && (
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-transparent focus:ring-2 focus:ring-imos-white/20"
            onClick={toggle}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} content`}
          >
            <ArrowDownIcon
              color="imos-grey"
              className={cn(
                'transition-transform duration-300 ease-in-out',
                shouldRotate && 'rotate-180',
              )}
            />
          </Button>
        )}
      </div>
    </div>
  );
};
