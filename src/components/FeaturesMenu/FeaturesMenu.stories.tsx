import type { Meta, StoryObj } from '@storybook/react';
import { LayersIcon, MapsIcon } from '../Icons';
import { FeaturesMenu } from './FeaturesMenu';

const meta = {
  title: 'components/FeaturesMenu',
  component: FeaturesMenu,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturesMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    features: [
      { icon: LayersIcon, label: 'Options' },
      { icon: MapsIcon, label: 'Maps' },
    ],
  },
};
