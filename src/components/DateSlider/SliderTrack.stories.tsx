import type { Meta, StoryObj } from '@storybook/react';
import { SliderTrack } from './SliderTrack';
import { getPeriodTimeScales, generateScalesWithInfo } from '@/utils';

const meta: Meta<typeof SliderTrack> = {
  title: 'Components/Slider/SliderTrack',
  component: SliderTrack,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onTrackClick: { action: 'track clicked' },
    baseTrackclassName: { control: 'text' },
    inactiveTrackClassName: { control: 'text' },
    activeTrackClassName: { control: 'text' },
    pointPosition: {
      control: { type: 'range', min: 0, max: 100 },
    },
    rangeStart: {
      control: { type: 'range', min: 0, max: 100 },
    },
    rangeEnd: {
      control: { type: 'range', min: 0, max: 100 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SliderTrack>;

// Point Mode
export const PointMode: Story = {
  args: {
    mode: 'point',
    pointPosition: 30,
  },
  render: args => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 1, 1);
    const timeUnit = 'day';
    const totalScaleUnits = getPeriodTimeScales(start, end, timeUnit);

    const { scales } = generateScalesWithInfo(start, end, timeUnit, totalScaleUnits);
    return <SliderTrack {...args} scales={scales} />;
  },
};

// Range Mode
export const RangeMode: Story = {
  args: {
    mode: 'range',
    rangeStart: 20,
    rangeEnd: 70,
    inactiveTrackClassName: '',
    activeTrackClassName: '',
  },
  render: args => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 1, 1);
    const timeUnit = 'day';
    const totalScaleUnits = getPeriodTimeScales(start, end, timeUnit);

    const { scales } = generateScalesWithInfo(start, end, timeUnit, totalScaleUnits);
    return <SliderTrack {...args} scales={scales} />;
  },
};

// Combined Mode
export const CombinedMode: Story = {
  args: {
    mode: 'combined',
    rangeStart: 10,
    rangeEnd: 90,
    pointPosition: 50,
    inactiveTrackClassName: '',
    activeTrackClassName: '',
  },
  render: args => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 1, 1);
    const timeUnit = 'day';
    const totalScaleUnits = getPeriodTimeScales(start, end, timeUnit);

    const { scales } = generateScalesWithInfo(start, end, timeUnit, totalScaleUnits);
    return <SliderTrack {...args} scales={scales} />;
  },
};
