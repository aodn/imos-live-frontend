import { useRef, useState } from 'react';
import { DateSlider } from './DateSlider';
import type { SliderProps, TimeUnit, SelectionResult } from './type';
import { FaDotCircle, FaArrowsAltH } from 'react-icons/fa';
import { Button } from '../Button';

export default {
  title: 'Components/DateSlider',
  component: DateSlider,
  argTypes: {
    viewMode: {
      control: { type: 'select' },
      options: ['range', 'point', 'combined'],
    },
    initialTimeUnit: {
      control: { type: 'select' },
      options: ['day', 'month', 'year'],
    },
    isTrackFixedWidth: { control: 'boolean' },
    scrollable: { control: 'boolean' },
    sliderWidth: { control: 'text' },
    sliderHeight: { control: 'number' },
    minGapScaleUnits: { control: 'number' },
  },
};

const Template = (args: Partial<SliderProps>) => {
  const [selection, setSelection] = useState<SelectionResult>();
  const sliderRef = useRef<any>(null);

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: 400 }}>
      <DateSlider
        {...args}
        onChange={setSelection}
        imperativeHandleRef={sliderRef}
        pointHandleIcon={<FaDotCircle />}
        rangeHandleIcon={<FaArrowsAltH />}
      />
      <div style={{ marginTop: 24, fontFamily: 'monospace' }}>
        <strong>Selection Output:</strong>
        <pre>{JSON.stringify(selection, null, 2)}</pre>
      </div>
      <div style={{ marginTop: 8 }}>
        <Button
          onClick={() => sliderRef.current?.setDateTime(new Date(Date.UTC(2022, 0, 1)), 'point')}
        >
          Set Point to 2022-01-01
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={() => sliderRef.current?.focusHandle('point')}>
          Focus Point Handle
        </Button>
      </div>
    </div>
  );
};

export const RangeMode = Template.bind({});
RangeMode.args = {
  viewMode: 'range',
  startDate: new Date('2020-01-01'),
  endDate: new Date('2025-03-15'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: { start: new Date(Date.UTC(2021, 2, 1)), end: new Date(Date.UTC(2021, 5, 1)) },
  sliderWidth: 800,
  sliderHeight: 120,
  trackActiveClassName: 'bg-blue-400/20',
  trackBaseClassName: 'bg-gray-200/20',
};

export const PointMode = Template.bind({});
PointMode.args = {
  viewMode: 'point',
  startDate: new Date('2019-01-01'),
  endDate: new Date('2020-03-15'),
  initialTimeUnit: 'day' as TimeUnit,
  initialPoint: new Date('2020-01-20'),
  sliderWidth: 600,
  sliderHeight: 90,
  trackActiveClassName: 'bg-green-400/20',
  trackBaseClassName: 'bg-gray-100/20',
};

export const CombinedMode = Template.bind({});
CombinedMode.args = {
  viewMode: 'combined',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2022-11-11'),
  initialTimeUnit: 'day' as TimeUnit,
  initialRange: { start: new Date(Date.UTC(2021, 2, 1)), end: new Date(Date.UTC(2021, 5, 1)) },
  initialPoint: new Date(Date.UTC(2022, 7, 1)),
  sliderWidth: 900,
  sliderHeight: 140,
  trackActiveClassName: 'bg-yellow-400/20',
  trackBaseClassName: 'bg-gray-300/20',
};

export const FixedWidthTrack = Template.bind({});
FixedWidthTrack.args = {
  viewMode: 'range',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2022-11-11'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    startDate: new Date('2020-11-05'),
    endDate: new Date('2020-12-05'),
  },
  sliderWidth: 'fill',
  isTrackFixedWidth: true,
};

export const ScrollableSlider = Template.bind({});
ScrollableSlider.args = {
  viewMode: 'range',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2021-11-11'),
  initialTimeUnit: 'day' as TimeUnit,
  initialRange: {
    startDate: new Date('2020-11-05'),
    endDate: new Date('2020-12-05'),
  },
  sliderWidth: 'fill',
  scrollable: true,
  minGapScaleUnits: 10,
};

export const CustomStyles = Template.bind({});
CustomStyles.args = {
  viewMode: 'combined',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2022-11-11'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    startDate: new Date('2020-11-05'),
    endDate: new Date('2020-12-05'),
  },
  initialPoint: new Date('2022-10-10'),
  sliderWidth: 700,
  sliderHeight: 110,
  wrapperClassName: 'rounded-xl shadow-lg bg-white',
  sliderClassName: 'rounded-md border border-gray-400',
  trackActiveClassName: 'bg-indigo-400/20',
  trackBaseClassName: 'bg-gray-50',
  timeUnitSlectionClassName: 'bg-gray-50 p-2 rounded',
};
