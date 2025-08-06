import { OVERLAY_LAYER_ID, PARTICLE_LAYER_ID, WAVE_BUOYS_LAYER_ID } from '@/constants';
import { WaterSurfaceIcon, WaveIcon, RadarIcon, SatelliteIcon } from '../Icons';
import { LayersDataset } from './MainSidebarContent';
import occeanCurrentImage from '@/assets/layer_test_1.jpg';
import anomalySeaLevelImage from '@/assets/layer_test_2.jpg';
import waveBuoysImage from '@/assets/layer_test_3.jpg';
import loggImage from '@/assets/imos_logo_with_title.png';

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
