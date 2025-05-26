// MapControlPanel.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MapControlPanel } from './MapControlPanel';

const meta: Meta<typeof MapControlPanel> = {
  title: 'MapControlPanel',
  component: MapControlPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MapControlPanel>;

export const Default: Story = {
  render: args => {
    return (
      <MapControlPanel
        {...args}
        onZoomIn={() => alert('Zoom in')}
        onZoomOut={() => alert('Zoom out')}
        onPan={() => alert('Toggle pan mode')}
      />
    );
  },
  args: {
    // No need to set anything unless you want to pre-toggle activePan.
  },
};
