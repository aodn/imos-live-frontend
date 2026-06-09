import type { Meta, StoryObj } from '@storybook/react';
import { ExportPanel } from './ExportPanel';
import { CategoryColorScaleBar } from '@/components/ColorScaleBar';
import { LinearColorScaleBar } from '@/components/ColorScaleBar';
import { HW_CATEGORY_LEGEND_SCALES } from '@/constants';
import { COLOR_OPTIONS } from '@/constants';

const MHW_CATEGORY_LEGEND_COLORS = COLOR_OPTIONS.MHW_CATEGORY_LEGEND_COLORS;
const SST_COLORS = COLOR_OPTIONS.RdBu_r;

const meta = {
  title: 'components/MapExportPanel',
  component: ExportPanel,
  parameters: { layout: 'centered', backgrounds: { default: 'map' } },
  tags: ['autodocs'],
} satisfies Meta<typeof ExportPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DateOnly: Story = {
  args: {
    date: '2024-06-15',
  },
};

export const WithCategoricalLegend: Story = {
  args: {
    date: '2024-06-15',
    product: {
      name: 'MHW Category',
      legend: (
        <CategoryColorScaleBar
          colors={MHW_CATEGORY_LEGEND_COLORS}
          scales={HW_CATEGORY_LEGEND_SCALES}
        />
      ),
    },
  },
};

export const WithLinearLegend: Story = {
  args: {
    date: '2024-06-15',
    product: {
      name: 'SST Anomaly',
      legend: (
        <LinearColorScaleBar min={-4} max={4} colors={SST_COLORS} label="degrees Celsius (°C)" />
      ),
    },
  },
};
