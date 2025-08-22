import type { Meta, StoryObj } from '@storybook/react';
import { ColorScaleBar } from './ColorScaleBar';
import { gslaOverlayImageColors, gslaAnomalySeaLevelsRange } from '@/config';

const meta = {
  title: 'Components/ColorScaleBar',
  component: ColorScaleBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ColorScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    colors: gslaOverlayImageColors,
    title: 'anomaly sea level (m)',
    min: gslaAnomalySeaLevelsRange[0],
    max: gslaAnomalySeaLevelsRange[1],
    className: 'w-60',
  },
};
