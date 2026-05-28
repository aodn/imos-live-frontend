import logoImage from '@/assets/imos_logo_with_title.png';
import oceanCurrentImage from '@/assets/ocean-current.webp';
import anomalySeaLevelImage from '@/assets/sea-levels.webp';
import waveBuoysImage from '@/assets/wave-buoys.webp';
import sstImage from '@/assets/sst.jpg';
import { PRODUCT, PRODUCTS } from '@/constants';
import {
  RadarIcon,
  SatelliteIcon,
  ThermometerIcon,
  WaterSurfaceIcon,
  WaveBuoyIcon,
  WaveIcon,
} from '../Icons';
import type { LayersDataset } from './MainSidebarContent';
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

export const featuredDataset: LayersDataset[] = [
  {
    image: {
      src: oceanCurrentImage,
      alt: 'GSLA Ocean geostrophic current',
    },
    title: 'GSLA Ocean geostrophic current',
    icon: <WaveIcon size="lg" />,
    description:
      'Gridded sea level (GSL) and surface geostrophic velocity (UCUR,VCUR) for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    layerId: PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
    addToMap: setProductEnabledByProduct,
    portalLink: 'https://portal-beta.aodn.org.au/details/0c9eb39c-9cbe-4c6a-8a10-5867087e703a',
  },
  {
    image: {
      src: anomalySeaLevelImage,
      alt: 'GSLA sea level anomaly',
    },
    title: 'GSLA sea level anomaly',
    icon: <WaterSurfaceIcon size="lg" />,
    description:
      'Gridded (adjusted) sea level anomaly (GSLA)' +
      ' for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    layerId: PRODUCTS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
    addToMap: setProductEnabledByProduct,
    portalLink: 'https://portal-beta.aodn.org.au/details/0c9eb39c-9cbe-4c6a-8a10-5867087e703a',
  },
  {
    image: {
      src: sstImage,
      alt: 'Marine heatwave SSTA Mosaic',
    },
    title: 'Marine heatwave sea surface temperature anomaly (SSTA) mosaic',
    icon: <ThermometerIcon size="lg" />,
    description:
      'Sea Surface Temperature Anomaly (SSTA) mosaic for the Australasian region, showing deviations from the long-term mean to identify marine heatwave conditions.',
    layerId: PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
    addToMap: setProductEnabledByProduct,
    portalLink:
      'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Marine%20Heatwave',
  },
  {
    image: {
      src: sstImage,
      alt: 'Marine heatwave SST Mosaic',
    },
    title: 'Marine heatwave sea surface temperature (SST) Mosaic',
    icon: <ThermometerIcon size="lg" />,
    description:
      'Sea Surface Temperature Anomaly (SSTA) mosaic for the Australasian region, showing deviations from the long-term mean to identify marine heatwave conditions.',
    layerId: PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
    addToMap: setProductEnabledByProduct,
    portalLink:
      'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Marine%20Heatwave',
  },
  {
    image: {
      src: sstImage,
      alt: 'Marine heatwave SST Mosaic',
    },
    title: 'Marine heatwave sea surface temperature MCS Category',
    icon: <ThermometerIcon size="lg" />,
    description:
      'Sea Surface Temperature Anomaly (SSTA) mosaic for the Australasian region, showing deviations from the long-term mean to identify marine heatwave conditions.',
    layerId: PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY,
    addToMap: setProductEnabledByProduct,
    portalLink:
      'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Marine%20Heatwave',
  },
  {
    image: {
      src: waveBuoysImage,
      alt: 'Wave buoys',
    },
    title: 'Wave buoys',
    icon: <WaveBuoyIcon size="lg" />,
    description:
      'Buoys provide integral wave parameters. Buoy data from the following organisations contribute to the National Wave Archive: Manly Hydraulics Laboratory, Bureau of Meteorology, DOT, DES, IMOS, Gippsland Ports, DPE, UWA, Deakin University, Pilbara Ports Authority and Flinders University and SARDI.',
    layerId: PRODUCTS[PRODUCT.WAVE_BUOYS].layerId,
    visible: false,
    isError: false,
    product: PRODUCT.WAVE_BUOYS,
    addToMap: setProductEnabledByProduct,
    portalLink: ' https://portal-beta.aodn.org.au/details/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc',
  },
];

export const layerProductsMock = [
  {
    label: 'Product 1',
    Icon: WaterSurfaceIcon,
    fn: () => alert('Product 1 clicked'),
  },
  {
    label: 'Product 2',
    Icon: RadarIcon,
    fn: () => alert('Product 2 clicked'),
  },
  {
    label: 'Product 3',
    Icon: WaveIcon,
    fn: () => alert('Product 3 clicked'),
  },
  {
    label: 'Product 4',
    Icon: SatelliteIcon,
    fn: () => alert('Product 4 clicked'),
  },
];
