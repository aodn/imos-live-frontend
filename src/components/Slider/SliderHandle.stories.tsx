import type { Meta, StoryObj } from '@storybook/react';
import { SliderHandle } from './SliderHandle';
import { TriangleIcon } from '../Icons';
const meta: Meta<typeof SliderHandle> = {
  title: 'Components/Slider/SliderHandle',
  component: SliderHandle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Left position percentage of the handle',
    },
    label: {
      control: { type: 'number' },
      description: 'Label shown when dragging',
    },
    onDragging: {
      control: { type: 'boolean' },
      description: 'Whether the handle is being dragged',
    },
    className: {
      control: 'text',
    },
    labelClassName: {
      control: 'text',
    },
    onMouseDown: { action: 'mouse down' },
  },
};

export default meta;
type Story = StoryObj<typeof SliderHandle>;

export const Default: Story = {
  args: {
    position: 50,
    label: 50,
    onDragging: true,
    icon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
};
