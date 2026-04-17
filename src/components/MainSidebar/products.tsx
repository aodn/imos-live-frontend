import loggImage from '@/assets/imos_logo_with_title.png';
import occeanCurrentImage from '@/assets/ocean-current.webp';
import anomalySeaLevelImage from '@/assets/sea-levels.webp';
import waveBuoysImage from '@/assets/wave-buoys.webp';
import sstImage from '@/assets/sst.jpg';
import {
  GSLA_RASTER_SOURCE_ID,
  GSLA_RASTER_LAYER_ID,
  GSLA_PARTICLE_LAYER_ID,
  AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  PRODUCT,
  AUSTEMP_SSTA_MOSAIC_RASTER_LAYER_ID,
  PRODUCTLEGENDS,
  AUSTEMP_DHD_MOSAIC_RASTER_LAYER_ID,
  AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID,
} from '@/constants';
import {
  RadarIcon,
  SatelliteIcon,
  ThermometerIcon,
  WaterSurfaceIcon,
  WaveBuoyIcon,
  WaveIcon,
} from '../Icons';
import type { LayersDataset } from './MainSidebarContent';
import { LogColorScaleBar, RasterLegend } from '../ColorScaleBar';
import { setProductEnabledByProduct } from '@/store';
import { gslaUrl, ausTempUrl } from '@/api/fileExist';

export const headerData = {
  title: 'IMOS Live',
  image: {
    src: loggImage,
    alt: 'IMOS Logo',
    height: 63,
    width: 147,
  },
};

export const featuredDataset: LayersDataset[] = [
  {
    image: {
      src: occeanCurrentImage,
      alt: 'GSLA Ocean geostrophic current',
    },
    title: 'GSLA Ocean geostrophic current',
    icon: <WaveIcon size="lg" />,
    description:
      'Gridded sea level (GSL) and surface geostrophic velocity (UCUR,VCUR) for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    layerId: GSLA_PARTICLE_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
    legend: (
      <LogColorScaleBar
        className="w-full"
        {...PRODUCTLEGENDS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]}
      />
    ),
    addToMap: setProductEnabledByProduct,
    dateCheckUrl: gslaUrl,
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
    layerId: GSLA_RASTER_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
    legend: (
      <RasterLegend
        rasterSource={GSLA_RASTER_SOURCE_ID}
        {...PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]}
      />
    ),
    addToMap: setProductEnabledByProduct,
    dateCheckUrl: gslaUrl,
    portalLink: 'https://portal-beta.aodn.org.au/details/0c9eb39c-9cbe-4c6a-8a10-5867087e703a',
  },
  {
    image: {
      src: sstImage,
      alt: 'AUS SSTA TEMP',
    },
    title: 'AusTemp Sea surface skin temperature anomaly',
    icon: <ThermometerIcon size="lg" />,
    description:
      'AusTemp is a specialised remote sensing application for the monitoring of SST conditions that lead to coral bleaching. The BOM legacy system was developed in consultation with Great Barrier Reef Marine Park Authority (GBRMPA) reef management and replaces the original CSIRO ReefTemp system (Maynard et al, 2008).',
    layerId: AUSTEMP_SSTA_MOSAIC_RASTER_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.AUSTEMP_SSTA_MOSAIC,
    legend: (
      <RasterLegend
        rasterSource={AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID}
        {...PRODUCTLEGENDS[PRODUCT.AUSTEMP_SSTA_MOSAIC]}
      />
    ),
    addToMap: setProductEnabledByProduct,
    dateCheckUrl: ausTempUrl,
    portalLink:
      'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Sea%20Surface%20Temperature',
  },
  {
    image: {
      src: sstImage,
      alt: 'AUS DHD TEMP',
    },
    title: 'AusTemp DHD',
    icon: <ThermometerIcon size="lg" />,
    description:
      'AusTemp is a specialised remote sensing application for the monitoring of SST conditions that lead to coral bleaching. The BOM legacy system was developed in consultation with Great Barrier Reef Marine Park Authority (GBRMPA) reef management and replaces the original CSIRO ReefTemp system (Maynard et al, 2008).',
    layerId: AUSTEMP_DHD_MOSAIC_RASTER_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.AUSTEMP_DHD_MOSAIC,
    legend: (
      <RasterLegend
        rasterSource={AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID}
        {...PRODUCTLEGENDS[PRODUCT.AUSTEMP_DHD_MOSAIC]}
      />
    ),
    addToMap: setProductEnabledByProduct,
    dateCheckUrl: ausTempUrl,
    portalLink:
      'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Sea%20Surface%20Temperature',
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
    layerId: WAVE_BUOYS_LAYER_ID,
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
