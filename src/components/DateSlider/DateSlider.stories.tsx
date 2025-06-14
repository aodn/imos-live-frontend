import { useRef, useState, useCallback, memo } from 'react';
import { DateSlider } from './DateSlider';
import type { SliderProps, TimeUnit, SelectionResult, DragHandle } from './type';
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
  parameters: {
    docs: {
      description: {
        component:
          'A flexible date slider component supporting point, range, and combined selection modes.',
      },
    },
  },
};

// Memoized selection display component
const SelectionDisplay = memo(({ selection }: { selection?: SelectionResult }) => (
  <div style={{ marginTop: 24, fontFamily: 'monospace' }}>
    <strong>Selection Output:</strong>
    <pre
      style={{
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '200px',
      }}
    >
      {JSON.stringify(selection, null, 2)}
    </pre>
  </div>
));

SelectionDisplay.displayName = 'SelectionDisplay';

// Memoized control buttons component
const ControlButtons = memo(
  ({
    sliderRef,
    viewMode,
  }: {
    sliderRef: React.RefObject<any>;
    viewMode: SliderProps['viewMode'];
  }) => {
    const handleSetDateTime = useCallback(
      (date: Date, target?: DragHandle) => {
        sliderRef.current?.setDateTime(date, target);
      },
      [sliderRef],
    );

    const handleFocusHandle = useCallback(
      (handle: DragHandle) => {
        sliderRef.current?.focusHandle(handle);
      },
      [sliderRef],
    );

    const buttonStyle = { marginLeft: 8, marginBottom: 8 };

    return (
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {(viewMode === 'point' || viewMode === 'combined') && (
          <>
            <Button onClick={() => handleSetDateTime(new Date('2022-01-01'), 'point')} size="sm">
              Set Point to 2022-01-01
            </Button>
            <Button onClick={() => handleFocusHandle('point')} variant="outline" size="sm">
              Focus Point Handle
            </Button>
          </>
        )}

        {(viewMode === 'range' || viewMode === 'combined') && (
          <>
            <Button
              onClick={() => handleSetDateTime(new Date('2021-06-01'), 'rangeStart')}
              size="sm"
              style={buttonStyle}
            >
              Set Range Start to 2021-06-01
            </Button>
            <Button
              onClick={() => handleSetDateTime(new Date('2021-09-01'), 'rangeEnd')}
              size="sm"
              style={buttonStyle}
            >
              Set Range End to 2021-09-01
            </Button>
            <Button
              onClick={() => handleFocusHandle('start')}
              variant="outline"
              size="sm"
              style={buttonStyle}
            >
              Focus Start Handle
            </Button>
            <Button
              onClick={() => handleFocusHandle('end')}
              variant="outline"
              size="sm"
              style={buttonStyle}
            >
              Focus End Handle
            </Button>
          </>
        )}

        <Button
          onClick={() => handleSetDateTime(new Date())}
          variant="secondary"
          size="sm"
          style={buttonStyle}
        >
          Set to Current Date
        </Button>
      </div>
    );
  },
);

ControlButtons.displayName = 'ControlButtons';

// Enhanced template with better performance and accessibility
const DateSliderTemplate = (args: Partial<SliderProps>) => {
  const [selection, setSelection] = useState<SelectionResult>();
  const sliderRef = useRef<any>(null);

  const handleSelectionChange = useCallback((newSelection: SelectionResult) => {
    setSelection(newSelection);
  }, []);

  return (
    <div
      style={{
        padding: 32,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: 500,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <DateSlider
          {...args}
          onChange={handleSelectionChange}
          imperativeHandleRef={sliderRef}
          pointHandleIcon={<FaDotCircle />}
          rangeHandleIcon={<FaArrowsAltH />}
        />

        <SelectionDisplay selection={selection} />

        <ControlButtons sliderRef={sliderRef} viewMode={args.viewMode || 'point'} />
      </div>
    </div>
  );
};

const Template = DateSliderTemplate;

// Story configurations with better defaults and documentation
export const RangeMode = Template.bind({});
RangeMode.args = {
  viewMode: 'range',
  startDate: new Date('2020-01-01'),
  endDate: new Date('2025-03-15'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    start: new Date('2021-03-01'),
    end: new Date('2021-06-01'),
  },
  sliderWidth: 800,
  sliderHeight: 120,
  trackActiveClassName: 'bg-blue-400/20',
  trackBaseClassName: 'bg-gray-200/20',
  minGapScaleUnits: 1,
};
RangeMode.storyName = 'Range Selection Mode';
RangeMode.parameters = {
  docs: {
    description: {
      story: 'Allows users to select a date range with start and end handles.',
    },
  },
};

export const PointMode = Template.bind({});
PointMode.args = {
  viewMode: 'point',
  startDate: new Date('2019-01-01'),
  endDate: new Date('2019-01-08'),
  initialTimeUnit: 'day' as TimeUnit,
  initialPoint: new Date('2019-01-01'),
  sliderWidth: 600,
  sliderHeight: 90,
  trackActiveClassName: 'bg-green-400/20',
  trackBaseClassName: 'bg-gray-100/20',
};
PointMode.storyName = 'Point Selection Mode';
PointMode.parameters = {
  docs: {
    description: {
      story: 'Allows users to select a single point in time.',
    },
  },
};

export const CombinedMode = Template.bind({});
CombinedMode.args = {
  viewMode: 'combined',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2025-11-11'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    start: new Date('2021-03-01'),
    end: new Date('2021-06-01'),
  },
  initialPoint: new Date('2023-08-01'),
  sliderWidth: 900,
  sliderHeight: 140,
  trackActiveClassName: 'bg-purple-400/20',
  trackBaseClassName: 'bg-gray-300/20',
  minGapScaleUnits: 2,
};
CombinedMode.storyName = 'Combined Selection Mode';
CombinedMode.parameters = {
  docs: {
    description: {
      story: 'Combines both range and point selection in a single slider.',
    },
  },
};

export const FixedTRackWidthSlider = Template.bind({});
FixedTRackWidthSlider.args = {
  viewMode: 'range',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2025-11-11'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    start: new Date('2021-11-05'),
    end: new Date('2022-01-05'),
  },
  sliderWidth: 'fill',
  isTrackFixedWidth: true,
  sliderHeight: 100,
  trackActiveClassName: 'bg-orange-400/20',
  trackBaseClassName: 'bg-gray-200/20',
};
FixedTRackWidthSlider.storyName = 'FixedTRackWidth';
FixedTRackWidthSlider.parameters = {
  docs: {
    description: {
      story: 'Slider that fills the available width with fixed track proportions.',
    },
  },
};

export const CustomStyles = Template.bind({});
CustomStyles.args = {
  viewMode: 'combined',
  startDate: new Date('2020-10-05'),
  endDate: new Date('2025-11-11'),
  initialTimeUnit: 'month' as TimeUnit,
  initialRange: {
    start: new Date('2021-11-05'),
    end: new Date('2022-01-05'),
  },
  initialPoint: new Date('2023-10-10'),
  sliderWidth: 700,
  sliderHeight: 110,
  wrapperClassName: 'rounded-xl shadow-lg bg-white border-2 border-indigo-200',
  sliderClassName: 'rounded-lg border border-gray-300 bg-gradient-to-r from-indigo-50 to-purple-50',
  trackActiveClassName: 'bg-gradient-to-r from-indigo-400/30 to-purple-400/30',
  trackBaseClassName: 'bg-gray-100 border border-gray-200',
  timeUnitSlectionClassName: 'bg-indigo-50 p-3 rounded-lg border border-indigo-200',
  minGapScaleUnits: 1,
  trackPaddingX: 48,
};
CustomStyles.storyName = 'Custom Styling';
CustomStyles.parameters = {
  docs: {
    description: {
      story: 'Demonstrates custom styling capabilities with gradients and borders.',
    },
  },
};

export const YearlyOverview = Template.bind({});
YearlyOverview.args = {
  viewMode: 'point',
  startDate: new Date('2000-01-01'),
  endDate: new Date('2030-12-31'),
  initialTimeUnit: 'year' as TimeUnit,
  initialPoint: new Date('2024-01-01'),
  sliderWidth: 800,
  sliderHeight: 100,
  trackActiveClassName: 'bg-rose-400/20',
  trackBaseClassName: 'bg-gray-200/20',
  scaleUnitConfig: {
    gap: 60,
    width: { short: 2, medium: 4, long: 8 },
    height: { short: 10, medium: 20, long: 40 },
  },
};
YearlyOverview.storyName = 'Yearly Timeline';
YearlyOverview.parameters = {
  docs: {
    description: {
      story: 'Long-term timeline spanning multiple decades with yearly granularity.',
    },
  },
};
