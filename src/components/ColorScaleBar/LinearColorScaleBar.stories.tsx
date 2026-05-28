import type { Meta, StoryObj } from '@storybook/react';
import { LinearColorScaleBar } from './LinearColorScaleBar';
import { anomalySeaLevel, PRODUCT, PRODUCTLEGENDS } from '@/constants';

const gslaRange = PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].range;

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
    colors: anomalySeaLevel.colors as [number, number, number][],
    label: 'anomaly sea level (m)',
    min: gslaRange[0],
    max: gslaRange[1],
    className: 'w-60',
  },
};
