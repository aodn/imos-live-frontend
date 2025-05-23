import type { Meta, StoryObj } from '@storybook/react';
import { DragWrapper } from './DragWrapper';
import { Button } from '../ui';

const meta = {
  title: 'DragWrapper',
  component: DragWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DragWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: (
      <div className="w-40">
        <Button className="dragHandleClassName">Drag me</Button>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Autem modi id illo omnis
          molestias adipisci magni ullam error, ipsam sapiente.
        </p>
      </div>
    ),
    bounds: 'parent',
    dragHandleClassName: 'dragHandleClassName',
  },
  render: args => {
    return (
      <div className="border-2 border-imos-red w-100 h-100">
        <DragWrapper {...args} />
      </div>
    );
  },
};
