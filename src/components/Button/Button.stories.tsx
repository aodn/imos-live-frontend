import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { MenuIcon } from '../Icons';
import { Loader2 } from 'lucide-react';
import { action } from '@storybook/addon-actions';

const meta = {
  title: 'Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: { onClick: { action: 'clicked' } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    children: 'Primary',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'lg',
    children: 'secondary',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    size: 'lg',
    children: 'Destructive',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'lg',
    children: 'Outline',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'lg',
    children: 'Ghost',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Icon: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <MenuIcon />,
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    size: 'lg',
    children: 'Link',
    className: 'cursor-pointer',
    onClick: action('on-click'),
  },
};

export const Loading: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    className: 'cursor-pointer',
    children: (
      <div className="flex items-center gap-x-2">
        <Loader2 className="animate-spin" />
        <span>Loading</span>
      </div>
    ),
    onClick: action('on-click'),
  },
};
