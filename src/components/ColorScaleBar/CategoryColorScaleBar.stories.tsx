import type { Meta, StoryObj } from '@storybook/react';
import { CategoryColorScaleBar } from './CategoryColorScaleBar';
import { MHW_CATEGORY_LEGEND_COLORS } from '@/helpers';

const MHW_CATEGORY_LABELS = ['Invalid', 'None', 'Moderate', 'Strong', 'Severe', 'Extreme'];

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
    values: [0, 1, 2, 3, 4, 5],
    label: 'MHW category',
    className: 'w-72',
  },
};

export const WithLabels: Story = {
  args: {
    colors: MHW_CATEGORY_LEGEND_COLORS,
    values: [0, 1, 2, 3, 4, 5],
    labels: MHW_CATEGORY_LABELS,
    label: 'MHW category',
    className: 'w-72',
  },
};
