import type { Meta, StoryObj } from '@storybook/react';
import { memo, useState, useRef } from 'react';
import type { SelectionResult, SliderProps, SliderExposedMethod, TimeUnit } from '../type';
import { DateSlider } from './DateSlider';

/**
 * DateSlider - A powerful, customizable date slider component
 *
 * Supports three modes:
 * - Point: Single date selection
 * - Range: Start and end date selection
 * - Combined: Both point and range selection
 */
const meta: Meta<typeof DateSlider> = {
  title: 'Components/DateSlider',
  component: DateSlider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible date slider supporting point, range, and combined selection modes with UTC date architecture.',
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['point', 'range', 'combined'],
      description: 'Selection mode',
      table: {
        type: { summary: "'point' | 'range' | 'combined'" },
        defaultValue: { summary: 'point' },
      },
    },
    initialTimeUnit: {
      control: 'select',
      options: ['hour', 'day', 'month', 'year'],
      description: 'Initial time unit for navigation',
      table: {
        type: { summary: "'hour' | 'day' | 'month' | 'year'" },
        defaultValue: { summary: 'day' },
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DateSlider>;

// Helper components for stories
const SelectionDisplay = memo(({ selection }: { selection?: SelectionResult }) => {
  if (!selection) return null;
  let result = '';
  if ('start' in selection && 'point' in selection) {
    result = `start: ${selection.start}\nend: ${selection.end}\npoint: ${selection.point}`;
  } else if ('start' in selection) {
    result = `start: ${selection.start}\nend: ${selection.end}`;
  } else if ('point' in selection) {
    result = `point: ${selection.point}`;
  }
  return (
    <div className="mt-6 font-mono">
      <strong>Selection:</strong>
      <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-xs mt-2">{result}</pre>
    </div>
  );
});

SelectionDisplay.displayName = 'SelectionDisplay';

function Template(args: Partial<SliderProps>) {
  const [selection, setSelection] = useState<SelectionResult>();
  const sliderRef = useRef<SliderExposedMethod>(null);

  return (
    <div className="p-8 bg-linear-to-br from-gray-50 to-gray-100 min-h-[400px] rounded-lg">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <DateSlider {...(args as any)} onChange={setSelection} imperativeRef={sliderRef} />
        <SelectionDisplay selection={selection} />
      </div>
    </div>
  );
}

/**
 * Default story - Minimal configuration with just the required props.
 */
export const Default: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: { point: '2024-06-15' },
    min: '2024-01-01',
    max: '2024-12-31',
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 600,
      height: 80,
    },
  },
};

/**
 * Point Mode - Single date selection.
 */
export const PointMode: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: { point: '2024-06-15' },
    min: '2024-01-01',
    max: '2024-12-31',
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 700,
      height: 60,
      dateLabelEnabled: true,
    },
  },
};

/**
 * Range Mode - Start and end date selection.
 */
export const RangeMode: Story = {
  render: Template,
  args: {
    mode: 'range',
    value: {
      start: '2024-03-01',
      end: '2024-09-01',
    },
    min: '2024-01-01',
    max: '2024-12-31',
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 800,
      height: 80,
      dateLabelEnabled: true,
    },
  },
};

/**
 * Combined Mode - Point and range selection together.
 */
export const CombinedMode: Story = {
  render: Template,
  args: {
    mode: 'combined',
    value: {
      start: '2024-03-01',
      end: '2024-09-01',
      point: '2024-06-15',
    },
    min: '2024-01-01',
    max: '2024-12-31',
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 900,
      height: 90,
      dateLabelEnabled: true,
    },
  },
};
