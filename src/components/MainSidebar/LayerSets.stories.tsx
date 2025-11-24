import type { Meta, StoryObj } from '@storybook/react';
import { LayerSets } from './LayerSets';
import { featuredDataset } from './products';

const meta = {
  title: 'components/MainSidebar/LayerSets',
  component: LayerSets,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayerSets>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    layersDatasets: featuredDataset,
    title: 'OC Products',
  },
};
