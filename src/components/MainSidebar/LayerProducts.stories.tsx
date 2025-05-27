import type { Meta, StoryObj } from '@storybook/react';
import { LayerProducts } from './LayerProducts';
import { WaterSurfaceIcon, RadarIcon, WaveIcon, SatelliteIcon } from '../Icons';

const meta = {
  title: 'components/MainSidebar/LayerProducts',
  component: LayerProducts,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayerProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    products: [
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
    ],
  },
};
