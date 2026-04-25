import type { Meta, StoryObj } from '@storybook/react';
import { LinearColorScaleBar } from './LinearColorScaleBar';
import { gslaRasterImageColors, gslaAnomalySeaLevelsRange } from '@/config';

const meta = {
  title: 'Components/ColorScaleBar/linear',
  component: LinearColorScaleBar,
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
} satisfies Meta<typeof LinearColorScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    colors: gslaRasterImageColors,
    label: 'anomaly sea level (m)',
    min: gslaAnomalySeaLevelsRange[0],
    max: gslaAnomalySeaLevelsRange[1],
    className: 'w-60',
  },
};
