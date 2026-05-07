import type { Meta, StoryObj } from '@storybook/react';
import { MapScaleBar } from './MapScaleBar';

const meta = {
  title: 'components/MapScaleBar',
  component: MapScaleBar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MapScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    scaleKm: 200,
    barWidthCss: 120,
  },
};

export const Compact: Story = {
  args: {
    scaleKm: 100,
    barWidthCss: 80,
    compact: true,
  },
};
