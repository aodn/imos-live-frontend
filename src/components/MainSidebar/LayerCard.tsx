import {
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import { Button } from '../Button';
import { ArrowDownIcon, MapLayersIcon } from '../Icons';
import { Image } from '../Image';
import { LayersDataset } from './MainSidebarContent';
import { CollapsibleComponent, TriggerArgs } from '../Collapsible';
import { cn } from '@/utils';
import { useViewportSize } from '@/hooks';
import { ReactNode } from 'react';
import { ColorScaleBar } from '../ColorScaleBar';
import { vectorConfig, gslaOverlayImageColors, gslaAnomalySeaLevelsRange } from '@/config';

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
  variant,
}: LayerCardProps) => {
  const { widthBreakpoint } = useViewportSize();
  const isSmallScreen = ['sm', 'md'].includes(widthBreakpoint || '');

  const variants = {
    [GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT]: {
      colors: Object.values(vectorConfig.colours),
      title: 'ocean current speed (m/s)',
      min: 0,
      max: vectorConfig.maxSpeed,
    },
    [GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT]: {
      colors: gslaOverlayImageColors,
      title: 'anomaly sea level (m)',
      min: gslaAnomalySeaLevelsRange[0],
      max: gslaAnomalySeaLevelsRange[1],
    },
  };

  const enableColorScaleBar =
    variant === 'gsla-ocean-geostrophic-current' || variant === 'gsla-anomaly-sea-levels';

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
        disable={!isSmallScreen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 md:p-4 pb-4 gap-y-4 md:gap-x-6  overflow-hidden">
          <div className="col-span-2 md:col-span-1 min-w-30 rounded-lg overflow-hidden aspect-square">
            <Image alt={image.alt} src={image.src} fill imageClassName="object-cover" />
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold mb-2 hidden md:block">{title}</h3>
              <p className="text-sm mb-3 leading-relaxed md:line-clamp-7" title={description}>
                {description}
              </p>
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
          {enableColorScaleBar && (
            <div className="col-span-2 md:mt-4">
              {
                <ColorScaleBar
                  className="w-full"
                  height={80}
                  tickCount={isSmallScreen ? 5 : 7}
                  {...variants[variant]}
                />
              }
            </div>
          )}
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
