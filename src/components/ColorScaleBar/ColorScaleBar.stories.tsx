import type { Meta, StoryObj } from '@storybook/react';
import { ColorScaleBar } from './ColorScaleBar';

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
    min: -1.2,
    max: 1.2,
    variant: 'gsla-anomaly-sea-levels',
    className: 'w-60',
  },
};
