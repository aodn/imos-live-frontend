import type { Meta, StoryObj } from '@storybook/react';
import { CategoryColorScaleBar } from './CategoryColorScaleBar';
import { COLOR_OPTIONS } from '@/constants';

const MHW_CATEGORY_LEGEND_COLORS = COLOR_OPTIONS.MHW_CATEGORY_LEGEND_COLORS;
// Mirrors the manifest's CF `flag_meanings` for the MHW category product.
const MHW_CATEGORY_FLAG_MEANINGS = ['none', 'moderate', 'strong', 'severe', 'extreme'];

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
    scales: MHW_CATEGORY_FLAG_MEANINGS,
    label: 'MHW category',
    className: 'w-72',
  },
};
