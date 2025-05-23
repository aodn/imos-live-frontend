import type { Meta, StoryObj } from '@storybook/react';
import { FloatingPanel } from './FloatingPanel';
import { CollapsibleTrigger } from './CollapsibleTrigger';
import { MenuComponent } from '../MenuComponent';
const meta = {
  title: 'FloatingPanel',
  component: FloatingPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: <MenuComponent />,
    TriggerComp: CollapsibleTrigger,
    initialPosition: {
      x: 0,
      y: 0,
    },
  },
  render: args => {
    return (
      <div className="relative border-2 border-imos-red w-[800px] h-[800px] overflow-hidden">
        <FloatingPanel {...args} />
      </div>
    );
  },
};
