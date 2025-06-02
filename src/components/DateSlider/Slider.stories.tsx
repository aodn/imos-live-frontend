import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';
import { TriangleIcon } from '../Icons';

const meta = {
  title: 'components/Slider/Slider',
  component: Slider,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    startDate: {
      control: 'date',
      description:
        'The starting date of the slider range. ⚠️ Must be a local `Date` object, not a UTC string. Use `new Date(y, m, d)`',
    },
    endDate: {
      control: 'date',
      description:
        'The ending date of the slider range. ⚠️ Must be a local `Date` object, not a UTC string. Use `new Date(y, m, d)`',
    },
    viewMode: {
      control: 'radio',
      options: ['point', 'range', 'combined'],
      description: 'Defines how the slider behaves: single point, range, or both.',
    },
    initialTimeUnit: {
      control: 'radio',
      options: ['day', 'month', 'year'],
      description: 'Time unit used for slider steps and labeling.',
    },
    initialRange: {
      control: false,
      description: 'Initial selected date range (only applicable for range or combined modes).',
    },
    initialPoint: {
      control: false,
      description:
        'Initial selected date (only applicable for point or combined modes). ⚠️ Must be a local `Date` object, not a UTC string. Use `new Date(y, m, d)`',
    },
    pointHandleIcon: {
      control: false,
      description: 'Custom icon component for the point handle.',
    },
    rangeHandleIcon: {
      control: false,
      description: 'Custom icon component for the range handles.',
    },
    wrapperClassName: {
      control: 'text',
      description: 'CSS class applied to the outer wrapper of the component.',
    },
    onChange: {
      action: 'changed',
      description: 'Callback triggered when slider value changes.',
    },
    scrollable: {
      control: 'boolean',
      description: 'If true, allows the entire slider to be dragged horizontally.',
    },
    isTrackFixedWidth: {
      control: 'boolean',
      description: 'If true, forces the slider to render track at a fixed width.',
    },
    trackFixedWidth: {
      control: 'number',
      description: 'Width in pixels to use if `isTrackFixedWidth` is true.',
    },
    minGapScaleUnits: {
      control: 'number',
      description: 'Minimum number of time units allowed between range handles.',
    },
    trackPaddingX: {
      control: 'number',
      description:
        'add padding between track. ensure slider handle and two ends of track can be seen',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PointMovable: Story = {
  args: {
    viewMode: 'point',
    initialTimeUnit: 'day',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2021, 1, 20),
    pointHandleIcon: <TriangleIcon size="xxl" color="imos-grey" />,
    wrapperClassName: 'my-10 bg-red-700',
    onChange: v => console.log(v),
    initialPoint: new Date(2020, 0, 7),
    scaleUnitConfig: {
      gap: 72,
      width: { short: 1, medium: 2, long: 2 },
      height: { short: 16, medium: 32, long: 108 },
    },
    sliderWidth: 500,
  },
  render: args => {
    return (
      <Slider {...args} startDate={new Date(args.startDate)} endDate={new Date(args.endDate)} />
    );
  },
};

export const PointStatic: Story = {
  args: {
    viewMode: 'point',
    initialTimeUnit: 'day',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2020, 0, 10),
    pointHandleIcon: <TriangleIcon size="xxl" color="imos-grey" />,
    wrapperClassName: 'my-10',
    onChange: v => console.log(v),
    initialPoint: new Date(2020, 0, 7),
    isTrackFixedWidth: true,
    trackFixedWidth: 400,
    scrollable: false,
  },
  render: args => {
    return (
      <Slider {...args} startDate={new Date(args.startDate)} endDate={new Date(args.endDate)} />
    );
  },
};

export const Combined: Story = {
  args: {
    viewMode: 'combined',
    initialTimeUnit: 'month',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2021, 11, 31),
    pointHandleIcon: <TriangleIcon size="xxl" color="imos-grey" />,
    rangeHandleIcon: <TriangleIcon size="xxl" color="imos-grey" className="rotate-180" />,
    wrapperClassName: 'mt-10 mx-auto',
    onChange: v => console.log(v),
    initialPoint: new Date(2020, 5, 10),
    initialRange: {
      start: new Date(2020, 2, 10),
      end: new Date(2021, 4, 10),
    },
  },
  render: args => {
    return (
      <Slider {...args} startDate={new Date(args.startDate)} endDate={new Date(args.endDate)} />
    );
  },
};

export const Range: Story = {
  args: {
    viewMode: 'range',
    initialTimeUnit: 'month',
    startDate: new Date(2020, 0, 1),
    endDate: new Date(2025, 11, 31),
    rangeHandleIcon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
    wrapperClassName: 'mt-10 mx-auto',
    onChange: v => console.log(v),
    initialRange: {
      start: new Date(2020, 0, 10),
      end: new Date(2020, 9, 10),
    },
  },
  render: args => {
    return (
      <Slider {...args} startDate={new Date(args.startDate)} endDate={new Date(args.endDate)} />
    );
  },
};
