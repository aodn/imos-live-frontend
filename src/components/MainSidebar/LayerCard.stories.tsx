import type { Meta, StoryObj } from '@storybook/react';
import { LayerCard } from './LayerCard';

const meta = {
  title: 'components/MainSidebar/LayerCard',
  component: LayerCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    image: {
      src: 'src/assets/layer_test_1.jpg',
      alt: 'Layer Test 1',
    },
    title: 'Featured Dataset 01',
    description:
      'm ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.m ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    addToMap: (v: boolean) => console.log(v),
    firstButtonLabel: 'Add to map',
    secondButtonLabel: 'Remove from map',
    visible: false,
    layerId: 'test layerid',
  },
};
