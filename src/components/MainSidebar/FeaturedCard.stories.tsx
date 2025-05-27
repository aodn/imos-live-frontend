import type { Meta, StoryObj } from '@storybook/react';
import { FeaturedCard } from './FeaturedCard';

const meta = {
  title: 'components/MainSidebar/FeaturedCard',
  component: FeaturedCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturedCard>;

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
    addToMap: () => console.log('Add to map clicked'),
  },
};
