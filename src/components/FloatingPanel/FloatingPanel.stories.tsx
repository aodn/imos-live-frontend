import type { Meta, StoryObj } from '@storybook/react';
import { FloatingPanel } from './FloatingPanel';
import { FeaturesMenu, LayersIcon, MapsIcon, MeasuresIcon } from '..';
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

export const Primary: Story = {
  args: {
    children: (
      <FeaturesMenu
        features={[
          { icon: LayersIcon, label: 'Layers' },
          { icon: MapsIcon, label: 'Maps' },
          { icon: MeasuresIcon, label: 'Measurement' },
        ]}
      />
    ),
    initialPosition: { x: 10, y: 20 },
    collapsible: true,
  },
  render: args => {
    return (
      // <div className="relative border-2 border-imos-red w-[800px] h-[800px] overflow-hidden">
      <FloatingPanel {...args} />
      // </div>
    );
  },
};
