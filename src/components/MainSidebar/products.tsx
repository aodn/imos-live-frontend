import loggImage from '@/assets/imos_logo_with_title.png';
import occeanCurrentImage from '@/assets/ocean-current.webp';
import anomalySeaLevelImage from '@/assets/sea-levels.webp';
import waveBuoysImage from '@/assets/wave-buoys.webp';
import sstImage from '@/assets/sst.jpg';
import {
  GSLA_OVERLAY_SOURCE_ID,
  GSLA_OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  WAVE_BUOYS_LAYER_ID,
  PRODUCT,
  SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID,
} from '@/constants';
import { RadarIcon, SatelliteIcon, ThermometerIcon, WaterSurfaceIcon, WaveIcon } from '../Icons';
import type { LayersDataset } from './MainSidebarContent';
import { LogColorScaleBar, RasterLegend } from '../ColorScaleBar';
import { setProductEnabledByProduct } from '@/store';
import { GSLA_OCEAN_CURRENT_COLORS_LEGEND_CONFIG } from '@/config';

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
    layerId: PARTICLE_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT,
    legend: <LogColorScaleBar className="w-full" {...GSLA_OCEAN_CURRENT_COLORS_LEGEND_CONFIG} />,
    addToMap: setProductEnabledByProduct,
  },
  {
    image: {
      src: anomalySeaLevelImage,
      alt: 'GSLA Anomaly sea levels',
    },
    title: 'GSLA Anomaly sea levels',
    icon: <WaterSurfaceIcon size="lg" />,
    description:
      'Gridded (adjusted) sea level anomaly (GSLA)' +
      ' for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    layerId: GSLA_OVERLAY_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
    legend: (
      <RasterLegend
        overlaySource={GSLA_OVERLAY_SOURCE_ID}
        scales={[-1.2, -0.5, -0.2, -0.1, 0, 0.1, 0.2, 0.5, 1.2]}
        label="anomaly sea level (m)"
      />
    ),
    addToMap: setProductEnabledByProduct,
  },
  {
    image: {
      src: sstImage,
      alt: 'AUS TEMP',
    },
    title: 'Sea surface skin temperature anomaly',
    icon: <ThermometerIcon size="lg" />,
    description:
      'AusTemp is a specialised remote sensing application for the monitoring of SST conditions that lead to coral bleaching. The BOM legacy system was developed in consultation with Great Barrier Reef Marine Park Authority (GBRMPA) reef management and replaces the original CSIRO ReefTemp system (Maynard et al, 2008).',
    layerId: SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.SST_ANOMALY_MOSAIC,
    legend: (
      <RasterLegend
        overlaySource={SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID}
        scales={[-10, -5, 0, 5, 10]}
        label="degrees Celsius (°C)"
      />
    ),
    addToMap: setProductEnabledByProduct,
  },
  {
    image: {
      src: waveBuoysImage,
      alt: 'Wave buoys',
    },
    title: 'Wave buoys',
    icon: <SatelliteIcon size="lg" />,
    description:
      'Buoys provide integral wave parameters. Buoy data from the following organisations contribute to the National Wave Archive: Manly Hydraulics Laboratory, Bureau of Meteorology, DOT, DES, IMOS, Gippsland Ports, DPE, UWA, Deakin University, Pilbara Ports Authority and Flinders University and SARDI.',
    layerId: WAVE_BUOYS_LAYER_ID,
    visible: false,
    isError: false,
    product: PRODUCT.WAVE_BUOYS,
    addToMap: setProductEnabledByProduct,
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
