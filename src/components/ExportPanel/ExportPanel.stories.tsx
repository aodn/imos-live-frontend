import type { Meta, StoryObj } from '@storybook/react';
import { ExportPanel } from './ExportPanel';
import { CategoryColorScaleBar } from '@/components/ColorScaleBar';
import { LinearColorScaleBar } from '@/components/ColorScaleBar';
import { HW_CATEGORY_LEGEND_SCALES } from '@/constants';
import { COLOR_OPTIONS } from '@/config';

const MHW_CATEGORY_LEGEND_COLORS = COLOR_OPTIONS.MHW_CATEGORY_LEGEND_COLORS;

const SST_COLORS = [
  '#2166ac',
  '#4393c3',
  '#92c5de',
  '#d1e5f0',
  '#f7f7f7',
  '#fddbc7',
  '#f4a582',
  '#d6604d',
  '#b2182b',
];

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
          labels={HW_CATEGORY_LEGEND_SCALES}
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
