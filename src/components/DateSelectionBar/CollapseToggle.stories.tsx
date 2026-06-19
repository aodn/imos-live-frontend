import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CollapseToggle } from './CollapseToggle';

const meta: Meta<typeof CollapseToggle> = {
  title: 'Components/DateSelectionBar/CollapseToggle',
  component: CollapseToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle button for collapsing/expanding the DateSelectionBar. Shows a left double-chevron when expanded and a right double-chevron when collapsed.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollapseToggle>;

export const Expanded: Story = {
  args: {
    collapsed: false,
    onToggle: () => {},
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
    onToggle: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return <CollapseToggle collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />;
  },
};
