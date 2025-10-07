import loggImage from '@/assets/imos_logo_with_title.png';
import occeanCurrentImage from '@/assets/ocean-current.webp';
import anomalySeaLevelImage from '@/assets/sea-levels.webp';
import waveBuoysImage from '@/assets/wave-buoys.webp';
import {
  GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
  GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
  GSLA_OVERLAY_SOURCE_ID,
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  SST_ANOMALY_MOSAIC_LAYER_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_PRODUCT_VARIANT,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_PRODUCT_VARIANT,
} from '@/constants';
import { RadarIcon, SatelliteIcon, ThermometerIcon, WaterSurfaceIcon, WaveIcon } from '../Icons';
import { LayersDataset } from './MainSidebarContent';
import { rasterLegendUrl } from '@/helpers/threddsUrl';

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
    addToMap: () => console.log('Add to map clicked'),
    visible: false,
    variant: GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT,
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
    layerId: OVERLAY_LAYER_ID,
    addToMap: () => console.log('Add to map clicked'),
    visible: false,
    variant: GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT,
    legend: (dataset: string) => {
      return (
        <div>
          <div className="w-full">
            <div
              className="w-full"
              style={{
                height: '12px',
                background: `url(${rasterLegendUrl(GSLA_OVERLAY_SOURCE_ID, new Date(dataset))})`,
              }}
            />
            <div className="w-full flex justify-between text-xs text-black mt-1">
              <span>-1.2</span>
              <span>-0.5</span>
              <span>-0.2</span>
              <span>-0.1</span>
              <span>0</span>
              <span>0.1</span>
              <span>0.2</span>
              <span>0.5</span>
              <span>1.2</span>
            </div>
          </div>

          <div className="mt-2 text-black text-sm text-center">
            <span>anomaly sea level (m)</span>
          </div>
        </div>
      );
    },
  },
  {
    image: {
      src: '',
      alt: 'AUS TEMP',
    },
    title: 'Sea surface skin temperature anomaly',
    icon: <ThermometerIcon size="lg" />,
    description:
      'AusTemp is a specialised remote sensing application for the monitoring of SST conditions that lead to coral bleaching. The BOM legacy system was developed in consultation with Great Barrier Reef Marine Park Authority (GBRMPA) reef management and replaces the original CSIRO ReefTemp system (Maynard et al, 2008).',
    layerId: SST_ANOMALY_MOSAIC_LAYER_ID,
    addToMap: () => console.log('Add to map clicked'),
    visible: false,
    variant: SST_ANOMALY_MOSAIC_PRODUCT_VARIANT,
    legend: (dataset: string) => {
      return (
        <div>
          <div className="w-full">
            <div
              className="w-full"
              style={{
                height: '12px',
                background: `url(${rasterLegendUrl(SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID, new Date(dataset))})`,
              }}
            />
            <div className="w-full flex justify-between text-xs text-black mt-1">
              <span>-10</span>
              <span>-5</span>
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <div className="mt-2 text-black text-sm text-center">
            <span>degrees Celsius (°C)</span>
          </div>
        </div>
      );
    },
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
    addToMap: () => console.log('Add to map clicked'),
    visible: false,
    variant: WAVE_BUOYS_PRODUCT_VARIANT,
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
