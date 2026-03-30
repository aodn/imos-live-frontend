import { WAVE_BUOYS_LAYER_ID } from '@/constants';
import { cn, getLatestFulfilledDate, toCompactDate, toISOFromCompact } from '@/utils';
import type { ReactNode } from 'react';
import { Button } from '../Button';
import type { TriggerArgs } from '../Collapsible';
import { CollapsibleComponent } from '../Collapsible';
import { AddCircleIcon, ArrowIcon, MinusCircleIcon, VectorIcon } from '../Icons';
import { Image } from '../Image';
import type { LayersDataset } from './MainSidebarContent';
import { useQuery } from '@tanstack/react-query';
import { fileExist, getWaveBuoyLatestDate } from '@/api';
import { setJumpToDate } from '@/store';
import { QUERY_DATE_RANGE } from '@/config';

export type LayerCardProps = LayersDataset & {
  dateCheckUrl?: (date: string) => string | string[];
  portalLink?: string;
};

export function LayerCard({
  image,
  title,
  description,
  addToMap,
  visible,
  isError,
  layerId,
  icon,
  product,
  legend,
  dateCheckUrl,
  portalLink,
}: LayerCardProps) {
  const isRasterProduct = product === 'gsla-anomaly-sea-levels' || product === 'sst-anom-mosaic';
  const isWaveBuoyProduct = product === 'wave-buoys';

  const { data: latestRasterDate, isLoading: isRasterDateLoading } = useQuery({
    queryKey: [product, QUERY_DATE_RANGE],
    queryFn: () => {
      const candidates = QUERY_DATE_RANGE.map(d => fileExist(dateCheckUrl!(d), d));
      return Promise.allSettled(candidates);
    },
    select: data => getLatestFulfilledDate(data),
    enabled: isRasterProduct,
    retry: false,
  });

  const { data: latestWaveBuoyDate, isLoading: isWaveBuoyLoading } = useQuery({
    queryKey: ['wave_buoy_latest_date'],
    queryFn: getWaveBuoyLatestDate,
    select: data => toCompactDate(data),
    enabled: isWaveBuoyProduct,
  });

  const handleClick = () => {
    if (addToMap) addToMap(product, !visible);
    if (layerId === WAVE_BUOYS_LAYER_ID) import('../Highcharts/WaveBuoyChart'); //preload wavebuoy chart when wavebuoylayer added.
  };

  const handleJumpToLatestRaster = () => {
    if (latestRasterDate) {
      setJumpToDate(toISOFromCompact(latestRasterDate));
    }
  };

  const handleJumpToLatestWaveBuoy = () => {
    if (latestWaveBuoyDate) {
      setJumpToDate(toISOFromCompact(latestWaveBuoyDate));
    }
  };

  return (
    <CollapsibleComponent
      wrapperClassName="md:rounded-lg md:shadow-lg bg-white md:border border-b border-gray-300 md:p-4 pb-4"
      defaultOpen
      isWidthFiexed
      overlayEnabled={isError}
      trigger={({ toggle, open, direction, toggleIconHidden }: TriggerArgs) => (
        <CardTrigger
          icon={icon}
          title={title}
          open={open}
          toggle={toggle}
          direction={direction}
          toggleIconHidden={toggleIconHidden}
          isError={isError}
        />
      )}
    >
      <div className="grid grid-cols-12  gap-4 md:gap-x-6  overflow-hidden">
        {/* description */}
        <div className="col-span-12 md:col-span-8">
          <div>
            <p className="text-body text-imos-grey line-clamp-5" title={description}>
              {description}
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="col-span-5 md:col-span-4 min-w-30 rounded-md overflow-hidden">
          <Image alt={image.alt} src={image.src} fill imageClassName="object-cover" />
        </div>

        <div className="col-span-7 md:col-span-12 flex flex-col md:flex-row gap-y-2 items-start md:items-center justify-between">
          {/* Buttons group */}
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              onClick={handleClick}
              variant={(visible && 'default') || 'outline'}
              className={cn('text-btn-mobile md:text-btn', {
                'text-imos-grey': !visible,
                'text-white bg-imos-blue': visible,
                'relative z-10': isError && visible,
              })}
            >
              {visible ? 'Remove from map' : 'Add to map'}
              {visible ? <MinusCircleIcon color="imos-white" /> : <AddCircleIcon />}
            </Button>

            {isRasterProduct && (
              <Button
                variant="outline"
                onClick={handleJumpToLatestRaster}
                disabled={isRasterDateLoading || !latestRasterDate}
                className="text-btn-mobile md:text-btn text-imos-grey w-fit relative z-10"
              >
                Latest Date
              </Button>
            )}
            {isWaveBuoyProduct && (
              <Button
                variant="outline"
                onClick={handleJumpToLatestWaveBuoy}
                disabled={isWaveBuoyLoading || !latestWaveBuoyDate}
                className="text-btn-mobile md:text-btn text-imos-grey w-fit relative z-10"
              >
                Latest Date
              </Button>
            )}
          </div>

          <Button
            variant={'outline'}
            asChild
            className="text-btn-mobile md:text-btn text-imos-grey relative z-10"
          >
            <a href={portalLink} target="_blank" rel="noopener noreferrer">
              More details
              <VectorIcon color="imos-grey" size="xs" />
            </a>
          </Button>
        </div>

        {!!legend && <div className="col-span-12">{legend}</div>}
      </div>
    </CollapsibleComponent>
  );
}

function CardTrigger({
  open,
  toggle,
  direction = 'down',
  toggleIconHidden = false,
  title,
  icon,
  isError,
}: TriggerArgs & { title: string; icon: ReactNode; isError?: boolean }) {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className="flex items-center justify-between">
      <div className="flex  gap-x-4">
        {icon}
        <h3 className={`text-title-sm mb-2`}>{title}</h3>
      </div>
      {!toggleIconHidden && (
        <Button
          variant="ghost"
          size="icon"
          className={cn('hover:bg-transparent focus:ring-2 focus:ring-imos-white/20', {
            'relative z-10': isError,
          })}
          onClick={toggle}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} content`}
        >
          <ArrowIcon
            color="imos-grey"
            className={cn(
              'transition-transform duration-300 ease-in-out',
              shouldRotate && 'rotate-180',
            )}
          />
        </Button>
      )}
    </div>
  );
}
