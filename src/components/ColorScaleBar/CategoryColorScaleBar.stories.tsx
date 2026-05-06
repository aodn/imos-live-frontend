import type { Meta, StoryObj } from '@storybook/react';
import { CategoryColorScaleBar } from './CategoryColorScaleBar';
import { MHW_CATEGORY_LEGEND_COLORS, HW_CATEGORY_LEGEND_LABELS } from '@/constants';

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
    labels: HW_CATEGORY_LEGEND_LABELS,
    label: 'MHW category',
    className: 'w-72',
  },
};
