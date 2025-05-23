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
    bounds: 'window',
    TriggerComp: CollapsibleTrigger,
    wrapperClassName: 'bg-[rgba(35,55,75,0.9)] text-[#ddd] font-mono rounded p-2',
  },
};
