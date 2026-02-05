import type { Meta, StoryObj } from '@storybook/react';
import { LogColorScaleBar } from './LogColorScaleBar';
import speedColors from '@/config/speed_colormap.json' with { type: 'json' };

const meta = {
  title: 'Components/ColorScaleBar/logarthmic',
  component: LogColorScaleBar,
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
} satisfies Meta<typeof LogColorScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    min: 0.01,
    max: 7,
    className: 'w-120',
    height: 12,
    colors: speedColors as [number, number, number][],
  },
};
