import type { Meta, StoryObj } from '@storybook/react';
import { LayerProducts } from './LayerProducts';
import { layerProductsMock } from './products';

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
    products: layerProductsMock,
    title: 'OC Products',
  },
};
