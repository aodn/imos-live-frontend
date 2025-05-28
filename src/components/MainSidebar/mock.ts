import { OVERLAY_LAYER_ID, PARTICLE_LAYER_ID, WAVE_BUOYS_LAYER_ID } from '@/constants';
import { WaterSurfaceIcon, WaveIcon, RadarIcon, SatelliteIcon } from '../Icons';
import { LayersDataset } from './MainSidebarContent';

export const headderDataMock = {
  title: 'IMOS Live',
  image: {
    src: 'src/assets/imos_logo_with_title.png',
    alt: 'IMOS Logo',
    height: 63,
    width: 147,
  },
};

export const featuredDatasetMock: LayersDataset[] = [
  {
    image: {
      src: 'src/assets/layer_test_1.jpg',
      alt: 'Layer Test 1',
    },
    title: 'GSLA Ocean current',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
    layerId: PARTICLE_LAYER_ID,
    visible: false,
  },
  {
    image: {
      src: 'src/assets/layer_test_2.jpg',
      alt: 'Layer Test 2',
    },
    title: 'GSLA Anomaly sea levels',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
    layerId: OVERLAY_LAYER_ID,
    visible: false,
  },
  {
    image: {
      src: 'src/assets/layer_test_3.jpg',
      alt: 'Layer Test 3',
    },
    title: 'Wave buoys',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
    layerId: WAVE_BUOYS_LAYER_ID,
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
