import type { TilesProduct } from '@/constants';
import { PRODUCT, PRODUCTS } from '@/constants';
import { COLOR_OPTIONS } from '@/config';
import { cn, toCompactDate, toISOFromCompact } from '@/utils';
import type { ReactNode } from 'react';
import { Button } from '../Button';
import type { TriggerArgs } from '../Collapsible';
import { CollapsibleComponent } from '../Collapsible';
import { Dropdown } from '../Dropdown';
import { AddCircleIcon, ArrowIcon, MinusCircleIcon, VectorIcon } from '../Icons';
import { Image } from '../Image';
import { LinearColorScaleBar, LogColorScaleBar } from '../ColorScaleBar';
import type { LayersDataset } from './MainSidebarContent';
import { useQuery } from '@tanstack/react-query';
import { getMetaDataManifest, getWaveBuoyLatestDate } from '@/api';
import { setJumpToDate, setProductLegend, useMapUIStore } from '@/store';

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
  layerId,
  icon,
  product,
  portalLink,
}: LayerCardProps) {
  const isWaveBuoyProduct = product === PRODUCT.WAVE_BUOYS;

  const productLegend = useMapUIStore(s =>
    !isWaveBuoyProduct ? s.productLegends[product as TilesProduct] : null,
  );
  const colorKey = productLegend?.colorKey ?? 'RdBu_r';
  const legendScale = productLegend?.scale ?? 'linear';

  const { data: tilesProductData, isLoading: isTilesProductDateLoading } = useQuery({
    queryKey: ['tiles_product_latest_date'],
    queryFn: getMetaDataManifest,
    select: ({ products }) => ({
      tilesProductLatestDate: products[product as TilesProduct].full_date_range.end,
    }),
    enabled: !isWaveBuoyProduct,
  });

  const tilesProductLatestDate = tilesProductData?.tilesProductLatestDate;

  const { data: latestWaveBuoyDate, isLoading: isWaveBuoyLoading } = useQuery({
    queryKey: ['wave_buoy_latest_date'],
    queryFn: getWaveBuoyLatestDate,
    select: data => toCompactDate(data),
    enabled: isWaveBuoyProduct,
  });

  const handleClick = () => {
    if (addToMap) addToMap(product, !visible);
    if (layerId === PRODUCTS[PRODUCT.WAVE_BUOYS].layerId) import('../Highcharts/WaveBuoyChart'); //preload wavebuoy chart when wavebuoylayer added.
  };

  const handleJumpToLatestTileslProduct = () => {
    if (tilesProductLatestDate) {
      setJumpToDate(tilesProductLatestDate);
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

            {!isWaveBuoyProduct && (
              <Button
                variant="outline"
                onClick={handleJumpToLatestTileslProduct}
                disabled={isTilesProductDateLoading || !tilesProductLatestDate}
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

        {!isWaveBuoyProduct && (
          <div className="col-span-12 flex gap-3">
            <Dropdown
              className="flex-1"
              size="sm"
              label="Color palette"
              options={Object.keys(COLOR_OPTIONS).map(key => ({ label: key, value: key }))}
              initialValue={colorKey}
              onChange={v =>
                setProductLegend(product as TilesProduct, {
                  colorKey: v as keyof typeof COLOR_OPTIONS,
                })
              }
              usePortal
            />
            {/* <Dropdown
              className="flex-1"
              size="sm"
              label="Scale"
              options={[
                { label: 'Linear', value: 'linear' },
                { label: 'Log', value: 'log' },
              ]}
              initialValue={legendScale}
              onChange={v =>
                setProductLegend(product as WebGlLayerProduct, { scale: v as 'log' | 'linear' })
              }
              usePortal
            /> */}
          </div>
        )}

        {!isWaveBuoyProduct && productLegend && (
          <div className="col-span-12">
            {legendScale === 'log' ? (
              <LogColorScaleBar
                className="w-full"
                colors={COLOR_OPTIONS[colorKey]}
                min={productLegend.range[0]}
                max={productLegend.range[1]}
                label={productLegend.label}
              />
            ) : (
              <LinearColorScaleBar
                className="w-full"
                colors={COLOR_OPTIONS[colorKey]}
                min={productLegend.range[0]}
                max={productLegend.range[1]}
                label={productLegend.label}
                scales={productLegend.scales}
              />
            )}
          </div>
        )}
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
