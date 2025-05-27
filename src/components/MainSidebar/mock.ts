import { WaterSurfaceIcon, WaveIcon, RadarIcon, SatelliteIcon } from '../Icons';
import { FeaturedCardProps } from './FeaturedCard';

export const headderDataMock = {
  title: 'IMOS Live',
  image: {
    src: 'src/assets/imos_logo_with_title.png',
    alt: 'IMOS Logo',
    height: 63,
    width: 147,
  },
};

export const featuredDatasetMock: FeaturedCardProps[] = [
  {
    image: {
      src: 'src/assets/layer_test_1.jpg',
      alt: 'Layer Test 1',
    },
    title: 'Featured Dataset 01',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
  },
  {
    image: {
      src: 'src/assets/layer_test_2.jpg',
      alt: 'Layer Test 2',
    },
    title: 'Featured Dataset 02',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
  },
  {
    image: {
      src: 'src/assets/layer_test_3.jpg',
      alt: 'Layer Test 3',
    },
    title: 'Featured Dataset 03',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: () => console.log('Add to map clicked'),
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
