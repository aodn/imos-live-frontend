import type { Meta, StoryObj } from '@storybook/react';
import { MapLoadingOverlay } from './MapLoadingOverlay';

const meta: Meta<typeof MapLoadingOverlay> = {
  component: MapLoadingOverlay,
  decorators: [
    Story => (
      <div className="relative w-96 h-64 bg-gray-300 rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MapLoadingOverlay>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    message: 'Fetching ocean data...',
    className: 'bg-imos-blue/80 text-white',
  },
};
