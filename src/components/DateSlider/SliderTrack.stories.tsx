import type { Meta, StoryObj } from '@storybook/react';
import { SliderTrack } from './SliderTrack';
import { getPeriodTimeScales, generateScalesWithInfo } from './dateSliderUtils';

const meta: Meta<typeof SliderTrack> = {
  title: 'Components/DateSlider/SliderTrack',
  component: SliderTrack,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div className="w-fit h-16">
        <Story />
      </div>
    ),
  ],
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

const DEFAULT_SCALE_CONFIG = {
  gap: 12,
  width: { short: 1, medium: 2, long: 2 },
  height: { short: 8, medium: 16, long: 64 },
};

export const PointMode: Story = {
  args: {
    mode: 'point',
    pointPosition: 30,
    baseTrackclassName: 'bg-neutral-200',
  },
  render: args => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 1, 1);
    const timeUnit = 'day';
    const totalScaleUnits = getPeriodTimeScales(start, end, timeUnit);
    const { scales } = generateScalesWithInfo(start, end, timeUnit, totalScaleUnits);
    return <SliderTrack {...args} scales={scales} scaleUnitConfig={DEFAULT_SCALE_CONFIG} />;
  },
};

export const RangeMode: Story = {
  args: {
    mode: 'range',
    rangeStart: 20,
    rangeEnd: 70,
    baseTrackclassName: 'bg-neutral-100 mx-auto',
    inactiveTrackClassName: 'bg-blue-200',
    activeTrackClassName: 'bg-rose-500/40',
  },
  render: args => {
    const start = new Date(2020, 0, 1);
    const end = new Date(2020, 1, 1);
    const timeUnit = 'day';
    const totalScaleUnits = getPeriodTimeScales(start, end, timeUnit);

    const { scales } = generateScalesWithInfo(start, end, timeUnit, totalScaleUnits);
    return <SliderTrack {...args} scales={scales} scaleUnitConfig={DEFAULT_SCALE_CONFIG} />;
  },
};
