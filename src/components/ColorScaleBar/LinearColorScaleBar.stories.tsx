import type { Meta, StoryObj } from '@storybook/react';
import { LinearColorScaleBar } from './LinearColorScaleBar';
import { gslaOverlayImageColors, gslaAnomalySeaLevelsRange } from '@/config';

const meta = {
  title: 'Components/LinearColorScaleBar',
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
    colors: gslaOverlayImageColors,
    title: 'anomaly sea level (m)',
    min: gslaAnomalySeaLevelsRange[0],
    max: gslaAnomalySeaLevelsRange[1],
    className: 'w-60',
  },
};
