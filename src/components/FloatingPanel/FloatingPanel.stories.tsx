import type { Meta, StoryObj } from '@storybook/react';
import { FeaturesMenu, LayersIcon, MapsIcon } from '..';
import { FloatingPanel } from './FloatingPanel';
const meta = {
  title: 'components/FloatingPanel',
  component: FloatingPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsible: Story = {
  args: {
    children: (
      <FeaturesMenu
        features={[
          { icon: LayersIcon, label: 'Options' },
          { icon: MapsIcon, label: 'Maps' },
        ]}
      />
    ),
    initialPosition: { x: 10, y: 20 },
    collapsible: true,
  },
  render: args => {
    return <FloatingPanel {...args} />;
  },
};

export const Uncollapsible: Story = {
  args: {
    children: (
      <FeaturesMenu
        features={[
          { icon: LayersIcon, label: 'Options' },
          { icon: MapsIcon, label: 'Maps' },
        ]}
      />
    ),
    initialPosition: { x: 10, y: 20 },
  },
  render: args => {
    return <FloatingPanel {...args} />;
  },
};
