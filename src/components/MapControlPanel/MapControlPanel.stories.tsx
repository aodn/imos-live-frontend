import type { Meta, StoryObj } from '@storybook/react';
import { MapControlPanel } from './MapControlPanel';

const meta: Meta<typeof MapControlPanel> = {
  title: 'components/MapControlPanel',
  component: MapControlPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MapControlPanel>;

export const Default: Story = {
  render: args => {
    return <MapControlPanel {...args} />;
  },
};
