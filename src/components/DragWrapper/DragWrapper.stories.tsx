import type { Meta, StoryObj } from '@storybook/react';
import { DragWrapper } from './DragWrapper';
import { Button } from '../Button';

const meta = {
  title: 'components/DragWrapper/DragWrapper',
  component: DragWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DragWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: (
      <div className="w-40 bg-blue-500 p-2 rounded-lg">
        <Button className="dragHandleClassName">Drag me</Button>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Autem modi id illo omnis
          molestias adipisci magni ullam error, ipsam sapiente.
        </p>
      </div>
    ),
    bounds: 'parent',
    dragHandleClassName: 'dragHandleClassName',
    initialPosition: { x: 100, y: 20 },
  },
  render: args => {
    return (
      <div className="border-2 border-imos-red w-100 h-100">
        <DragWrapper {...args} />
      </div>
    );
  },
};
