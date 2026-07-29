import type { ProductType, TilesProduct } from '@/constants';
import {
  COLOR_OPTIONS,
  CONTINOUS_PRODUCT_COLOR_OPTIONS,
  PRODUCT,
  PRODUCTLEGENDS,
} from '@/constants';
import { cn } from '@/utils';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMooringLatestDate, getWaveBuoyLatestDate, metaDataManifestQueryOptions } from '@/api';
import { setJumpToDate, setProductLegend, useMapUIStore } from '@/store';
import { Button } from '../Button';
import type { TriggerArgs } from '../Collapsible';
import { CollapsibleComponent } from '../Collapsible';
import { Dropdown } from '../Dropdown';
import { AddCircleIcon, ArrowIcon, MinusCircleIcon, VectorIcon } from '../Icons';
import { Image } from '../Image';
import { CategoryColorScaleBar, LinearColorScaleBar, LogColorScaleBar } from '../ColorScaleBar';
import type { LayersDataset } from './MainSidebarContent';

export type LayerCardProps = LayersDataset & {
  portalLink?: string;
};

export function LayerCard({
  image,
  title,
  description,
  addToMap,
  visible,
  isError,
  icon,
  product,
  portalLink,
}: LayerCardProps) {
  const isSiteProduct =
    product === PRODUCT.WAVE_BUOYS || product === PRODUCT.MOORING_TIMESERIES_REALTIME;

  const handleClick = () => {
    if (addToMap) addToMap(product, !visible);
    // Fire-and-forget prefetch of the matching drawer chart chunk.
    if (product === PRODUCT.WAVE_BUOYS) {
      void import('../Highcharts/WaveBuoyChart');
    } else if (product === PRODUCT.MOORING_TIMESERIES_REALTIME) {
      void import('../Highcharts/MooringChart');
    }
  };

  return (
    <CollapsibleComponent
      wrapperClassName="md:rounded-lg md:shadow-lg bg-white md:border border-b border-gray-300 md:p-4 pb-4"
      defaultOpen
      isWidthFixed
      overlayEnabled={isError}
      trigger={(args: TriggerArgs) => (
        <CardTrigger {...args} icon={icon} title={title} isError={isError} />
      )}
    >
      <div className="grid grid-cols-12  gap-4 md:gap-x-6  overflow-hidden">
        <div className="col-span-12 md:col-span-8">
          <div>
            <p className="text-body text-imos-grey line-clamp-5" title={description}>
              {description}
            </p>
          </div>
        </div>

        <div className="col-span-5 md:col-span-4 min-w-30 rounded-md overflow-hidden">
          <Image alt={image.alt} src={image.src} fill imageClassName="object-cover" />
        </div>

        <div className="col-span-7 md:col-span-12 flex flex-col md:flex-row gap-y-2 items-start md:items-center justify-between">
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

            <LatestDateButton product={product} />
          </div>

          <Button
            variant="outline"
            asChild
            className="text-btn-mobile md:text-btn text-imos-grey relative z-10"
          >
            <a href={portalLink} target="_blank" rel="noopener noreferrer">
              More details
              <VectorIcon color="imos-grey" size="xs" />
            </a>
          </Button>
        </div>

        {!isSiteProduct && <TilesLegendSection product={product as TilesProduct} />}
      </div>
    </CollapsibleComponent>
  );
}

function useLatestDate(product: ProductType) {
  const isMooring = product === PRODUCT.MOORING_TIMESERIES_REALTIME;
  const isSiteProduct = product === PRODUCT.WAVE_BUOYS || isMooring;

  const { data: tilesDate, isLoading: isTilesLoading } = useQuery({
    ...metaDataManifestQueryOptions(),
    select: ({ products }) => products.find(p => p.id === product)?.full_date_range.end,
    enabled: !isSiteProduct,
  });

  // Site products expose their own latest-time endpoint. Keep the query keys aligned
  // with the drawer charts (WaveBuoyChart/MooringChart) so the cache is shared.
  const { data: siteDate, isLoading: isSiteLoading } = useQuery({
    queryKey: [isMooring ? 'mooring_latest_date' : 'wave_buoy_latest_date'],
    queryFn: isMooring ? getMooringLatestDate : getWaveBuoyLatestDate,
    enabled: isSiteProduct,
  });

  const date = isSiteProduct ? siteDate : tilesDate;
  const isLoading = isSiteProduct ? isSiteLoading : isTilesLoading;

  const jumpToLatest = () => {
    if (date) setJumpToDate(date);
  };

  return { date, isLoading, jumpToLatest };
}

function LatestDateButton({ product }: { product: ProductType }) {
  const { date, isLoading, jumpToLatest } = useLatestDate(product);
  return (
    <Button
      variant="outline"
      onClick={jumpToLatest}
      disabled={isLoading || !date}
      className="text-btn-mobile md:text-btn text-imos-grey w-fit relative z-10"
    >
      Latest Date
    </Button>
  );
}

function TilesLegendSection({ product }: { product: TilesProduct }) {
  const productLegend = useMapUIStore(s => s.productLegends[product]);
  const colorKey = productLegend?.colorKey ?? 'RdBu_r';
  const isCategoryLegend = PRODUCTLEGENDS[product]?.scale === 'category';
  const colors = COLOR_OPTIONS[colorKey];

  return (
    <>
      {!isCategoryLegend && (
        <div className="col-span-12 flex gap-3">
          <Dropdown
            className="flex-1"
            size="sm"
            label="Color palette"
            options={Object.keys(CONTINOUS_PRODUCT_COLOR_OPTIONS).map(key => ({
              label: key,
              value: key,
            }))}
            initialValue={colorKey}
            onChange={v => setProductLegend(product, { colorKey: v as keyof typeof COLOR_OPTIONS })}
            usePortal
          />
        </div>
      )}

      {productLegend && (
        <div className="col-span-12">
          {productLegend.scale === 'log' && (
            <LogColorScaleBar
              className="w-full"
              colors={colors}
              min={productLegend.range[0]}
              max={productLegend.range[1]}
              label={productLegend.label}
            />
          )}
          {productLegend.scale === 'linear' && (
            <LinearColorScaleBar
              className="w-full"
              colors={colors}
              min={productLegend.range[0]}
              max={productLegend.range[1]}
              label={productLegend.label}
              scales={productLegend.scales as number[]}
            />
          )}
          {productLegend.scale === 'category' && (
            <CategoryColorScaleBar
              className="w-full"
              colors={colors}
              label={productLegend.label}
              scales={productLegend.scales as string[]}
            />
          )}
        </div>
      )}
    </>
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
        <h3 className="text-title-sm mb-2">{title}</h3>
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
