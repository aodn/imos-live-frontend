import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';
import { TriangleIcon } from '../Icons';

const meta = {
  title: 'components/Slider/Slider',
  component: Slider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Combined: Story = {
  args: {
    viewMode: 'combined',
    timeUnit: 'day',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2030, 11, 31),
    pointHandleIcon: <TriangleIcon size="xl" color="imos-grey" />,
    rangeHandleIcon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
    wrapperClassName: 'mt-10',
    onChange: v => console.log(v),
  },
  render: args => {
    return <Slider {...args} />;
  },
};

export const Point: Story = {
  args: {
    viewMode: 'point',
    timeUnit: 'year',
    startDate: new Date(1990, 0, 1),
    endDate: new Date(2030, 11, 31),
    pointHandleIcon: <TriangleIcon size="xl" color="imos-grey" />,
    wrapperClassName: 'mt-10',
    onChange: v => console.log(v),
  },
  render: args => {
    return <Slider {...args} />;
  },
};

export const Range: Story = {
  args: {
    viewMode: 'range',
    timeUnit: 'month',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2021, 11, 31),
    rangeHandleIcon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
    wrapperClassName: 'mt-10',
    onChange: v => console.log(v),
  },
  render: args => {
    return <Slider {...args} />;
  },
};
