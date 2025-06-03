import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    width: 160,
    height: 300,
  },
};

export const Seconday: Story = {
  args: {
    fill: true,
  },
  render: args => (
    <div className="h-100 w-80">
      <Skeleton {...args} />
    </div>
  ),
};
