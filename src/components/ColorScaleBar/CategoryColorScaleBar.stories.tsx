import type { Meta, StoryObj } from '@storybook/react';
import { CategoryColorScaleBar } from './CategoryColorScaleBar';
import { HW_CATEGORY_LEGEND_SCALES } from '@/constants';
import { COLOR_OPTIONS } from '@/config';

const MHW_CATEGORY_LEGEND_COLORS = COLOR_OPTIONS.MHW_CATEGORY_LEGEND_COLORS;

const meta = {
  title: 'Components/ColorScaleBar/category',
  component: CategoryColorScaleBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a discrete categorical color scale where each segment maps to a fixed value.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CategoryColorScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    colors: MHW_CATEGORY_LEGEND_COLORS,
    label: 'MHW category',
    className: 'w-72',
  },
};

export const WithLabels: Story = {
  args: {
    colors: MHW_CATEGORY_LEGEND_COLORS,
    scales: HW_CATEGORY_LEGEND_SCALES,
    label: 'MHW category',
    className: 'w-72',
  },
};
