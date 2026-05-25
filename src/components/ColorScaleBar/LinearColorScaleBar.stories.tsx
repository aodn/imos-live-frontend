import type { Meta, StoryObj } from '@storybook/react';
import { LinearColorScaleBar } from './LinearColorScaleBar';
import { COLOR_OPTIONS } from '@/config';
import { PRODUCT, PRODUCTLEGENDS } from '@/constants';

const anomalyLegend = PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS];

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
    colors: COLOR_OPTIONS[anomalyLegend.colorKey],
    label: anomalyLegend.label,
    min: anomalyLegend.range[0],
    max: anomalyLegend.range[1],
    className: 'w-60',
  },
};
