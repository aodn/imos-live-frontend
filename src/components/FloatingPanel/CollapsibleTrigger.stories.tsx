import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleTrigger } from './CollapsibleTrigger';
import { ArrowDownIcon, DragIndicatorIcon } from '..';
import { useState } from 'react';

const meta: Meta<typeof CollapsibleTrigger> = {
  title: 'CollapsibleTrigger',
  component: CollapsibleTrigger,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the panel is open (rotates arrow)',
    },
    dragHandleClass: {
      control: 'text',
      defaultValue: 'my-drag-handle',
      description: 'CSS class for drag handle',
    },
    toggle: { action: 'toggle (use in Controls panel)' },
  },
};

export default meta;

type Story = StoryObj<typeof CollapsibleTrigger>;

export const Default: Story = {
  args: {
    open: false,
    dragHandleClass: 'my-drag-handle',
    toggle: () => {},
    FirstIcon: ArrowDownIcon,
    SecondIcon: DragIndicatorIcon,
    clasName: 'w-40',
  },
};

export const Interactive: Story = {
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    return <CollapsibleTrigger {...args} open={open} toggle={() => setOpen(open => !open)} />;
  },
  args: {
    dragHandleClass: 'my-drag-handle',
    clasName: 'w-40',
  },
  parameters: {
    controls: { exclude: ['toggle'] },
  },
};
