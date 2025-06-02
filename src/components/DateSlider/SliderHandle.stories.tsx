import type { Meta, StoryObj } from '@storybook/react';
import { SliderHandle } from './SliderHandle';
import { TriangleIcon } from '../Icons';

const meta: Meta<typeof SliderHandle> = {
  title: 'Components/DateSlider/SliderHandle',
  component: SliderHandle,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div className="w-96 h-24 bg-gray-100 relative border rounded">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    position: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    onDragging: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
  },
  args: {
    position: 50,
    onDragging: false,
    label: 'Jan 2024',
    labelClassName: '-top-10',
    icon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
    onMouseDown: e => console.log('Handle clicked', e),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Dragging: Story = {
  args: {
    position: 30,
    onDragging: true,
    label: 'Mar 2024',
    labelClassName: 'top-10',
    icon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
};

export const AtStart: Story = {
  args: {
    position: 5,
    onDragging: true,
    label: 'Start',
    labelClassName: 'top-10',
    icon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
};

export const AtEnd: Story = {
  args: {
    position: 95,
    onDragging: true,
    label: 'End',
    labelClassName: 'top-10',
    icon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
};
