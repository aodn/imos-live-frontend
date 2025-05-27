import type { Meta, StoryObj } from '@storybook/react';
import { FeaturesMenu } from './FeaturesMenu';
import { LayersIcon, MapsIcon, MeasuresIcon } from '../Icons';

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
      { icon: LayersIcon, label: 'Layers' },
      { icon: MapsIcon, label: 'Maps' },
      { icon: MeasuresIcon, label: 'Measurement' },
    ],
  },
};
