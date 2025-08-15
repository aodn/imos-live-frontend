import { GSLA_META_NAME, WAVE_BUOYS_LAYER_ID } from '@/constants';
import { Button } from '../Button';
import { ArrowDownIcon, MapLayersIcon } from '../Icons';
import { Image } from '../Image';
import { LayersDataset } from './MainSidebarContent';
import { CollapsibleComponent, TriggerArgs } from '../Collapsible';
import { buildGSLADatasetPath, cn } from '@/utils';
import { useViewportSize } from '@/hooks';
import { ReactNode, useMemo } from 'react';
import { ColorScaleBar } from '../ColorScaleBar';
import { getMetaData } from '@/api';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { Skeleton } from '../Skeleton';

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

  const { dataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
    })),
  );

  //react query with same querykey will only be called once even put in multiple components.
  const { data, isLoading, isError } = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
    enabled: variant !== 'wave-buoys',
  });

  const colorScaleRange = useMemo(() => {
    if (variant === 'gsla-anomaly-sea-levels') return data?.gslaRange;
    if (variant === 'gsla-ocean-geostrophic-current') return data?.speedRange;
  }, [data?.gslaRange, data?.speedRange, variant]);

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
              {!isLoading && !isError && colorScaleRange && (
                <ColorScaleBar
                  className="w-full"
                  height={80}
                  variant={variant}
                  tickCount={isSmallScreen ? 5 : 7}
                  min={colorScaleRange[0]}
                  max={colorScaleRange[1]}
                />
              )}
              {isLoading && <Skeleton className="h-20 w-full" />}
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
