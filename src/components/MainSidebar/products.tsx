import logoImage from '@/assets/imos_logo_with_title.png';
import oceanCurrentImage from '@/assets/ocean-current.webp';
import anomalySeaLevelImage from '@/assets/sea-levels.webp';
import waveBuoysImage from '@/assets/wave-buoys.webp';
import sstImage from '@/assets/sst.jpg';
import type { ProductType } from '@/constants';
import { PRODUCT, PRODUCTS } from '@/constants';
import { ThermometerIcon, WaterSurfaceIcon, WaveBuoyIcon, WaveIcon } from '../Icons';
import type { LayersDataset } from './MainSidebarContent';
import type { ImageType } from '@/types';
import type { ReactNode } from 'react';
import { setProductEnabledByProduct } from '@/store';

export const headerData = {
  title: 'IMOS Live',
  image: {
    src: logoImage,
    alt: 'IMOS Logo',
    height: 63,
    width: 147,
  },
};

/**
 * Sidebar-specific presentation for each featured product. The factual product
 * copy (`description`, `portalLink`, `layerId`) is the single source of truth in
 * `PRODUCTS` (`@/constants`); only the display title, image and icon live here.
 * The array order is the order cards appear in the sidebar.
 */
type FeaturedPresentation = {
  product: ProductType;
  title: string;
  image: ImageType;
  icon: ReactNode;
};

const featuredPresentation: FeaturedPresentation[] = ((products: ProductType[]) => {
  return [
    {
      product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
      title: 'GSLA Ocean geostrophic current',
      image: { src: oceanCurrentImage, alt: 'GSLA Ocean geostrophic current' },
      icon: <WaveIcon size="lg" />,
    },
    {
      product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
      title: 'GSLA sea level anomaly',
      image: { src: anomalySeaLevelImage, alt: 'GSLA sea level anomaly' },
      icon: <WaterSurfaceIcon size="lg" />,
    },
    {
      product: PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
      title: 'Marine heatwave sea surface temperature anomaly (SSTA) mosaic',
      image: { src: sstImage, alt: 'Marine heatwave SSTA Mosaic' },
      icon: <ThermometerIcon size="lg" />,
    },
    {
      product: PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
      title: 'Marine heatwave sea surface temperature (SST) Mosaic',
      image: { src: sstImage, alt: 'Marine heatwave SST Mosaic' },
      icon: <ThermometerIcon size="lg" />,
    },
    {
      product: PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC,
      title: 'Marine heatwave sea surface temperature MHW Category Mosaic',
      image: { src: sstImage, alt: 'Marine heatwave MHW Category Mosaic' },
      icon: <ThermometerIcon size="lg" />,
    },
    {
      product: PRODUCT.WAVE_BUOYS,
      title: 'Wave buoys',
      image: { src: waveBuoysImage, alt: 'Wave buoys' },
      icon: <WaveBuoyIcon size="lg" />,
    },
    {
      product: PRODUCT.MOORING_TIMESERIES_REALTIME,
      title: 'Mooring timeseries realtime',
      image: { src: sstImage, alt: 'Mooring timeseries realtime' },
      icon: <ThermometerIcon size="lg" />,
    },
  ].filter(({ product }) => products.includes(product));
})([
  PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
  PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC,
  PRODUCT.WAVE_BUOYS,
  PRODUCT.MOORING_TIMESERIES_REALTIME,
]);

export const featuredDataset: LayersDataset[] = featuredPresentation.map(
  ({ product, title, image, icon }) => ({
    product,
    title,
    image,
    icon,
    description: PRODUCTS[product].description,
    portalLink: PRODUCTS[product].portalLink,
    layerId: PRODUCTS[product].layerId,
    visible: false,
    isError: false,
    addToMap: setProductEnabledByProduct,
  }),
);
