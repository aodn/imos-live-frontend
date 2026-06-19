// Import dayjs locales for locale demo
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/ja';
import 'dayjs/locale/es';
import type { Meta, StoryObj } from '@storybook/react';
import { CircleIcon, MoveHorizontalIcon } from 'lucide-react';
import { memo, useState, useRef } from 'react';
import type { SelectionResult, SliderProps, SliderExposedMethod, TimeUnit } from '../type';
import { toUTCDate } from '../utils';
import { DateSlider } from './DateSlider';

/**
 * DateSlider - A powerful, customizable date slider component
 *
 * Supports three modes:
 * - Point: Single date selection
 * - Range: Start and end date selection
 * - Combined: Both point and range selection
 *
 * Features:
 * - Fully customizable with Tailwind CSS
 * - Built-in default icons and renderers
 * - Mobile-optimized with automatic responsive behavior
 * - Keyboard accessible (WCAG compliant)
 * - Optional UI components (date labels, time display, unit selector)
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
    result = `start: ${selection.start.toISOString()}\nend: ${selection.end.toISOString()}\npoint: ${selection.point.toISOString()}`;
  } else if ('start' in selection) {
    result = `start: ${selection.start.toISOString()}\nend: ${selection.end.toISOString()}`;
  } else if ('point' in selection) {
    result = `point: ${selection.point.toISOString()}`;
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
 * Default story - Minimal configuration
 *
 * Shows the simplest possible setup with just required props.
 * Perfect starting point for new users.
 */
export const Default: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: { point: toUTCDate('2024-06-15') },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 600,
      height: 80,
    },
  },
};

/**
 * Point Mode - Single date selection
 *
 * Demonstrates point mode with custom styling and date formatting.
 */
export const PointMode: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: { point: toUTCDate('2024-06-15') },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 700,
      height: 60,
      dateLabelEnabled: true,
    },
    classNames: {
      trackActive: 'bg-green-500/30',
      track: 'bg-gray-300',
      scaleMarkMajor: 'bg-green-600',
      scaleLabel: 'text-green-800 font-medium',
    },
    dateFormat: {
      scale: ({ date }) => {
        const day = date.getUTCDate();
        return day === 1 ? 'MMM YYYY' : '';
      },
      label: () => 'DD-MMM-YYYY',
    },
  },
};

/**
 * Range Mode - Date range selection
 *
 * Shows range selection with scrollable behavior and custom scale configuration.
 */
export const RangeMode: Story = {
  render: Template,
  args: {
    mode: 'range',
    value: {
      start: toUTCDate('2020-03-01'),
      end: toUTCDate('2022-09-01'),
    },
    min: toUTCDate('2020-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 800,
      height: 80,
      dateLabelEnabled: true,
      scaleUnitConfig: {
        gap: 80,
        width: { short: 1, medium: 1, long: 2 },
        height: { short: 15, medium: 25, long: 45 },
      },
    },
    behavior: {
      rangeHandleLabelPersistent: true,
      scrollable: true,
      freeSelectionOnTrackClick: true,
    },
    classNames: {
      trackActive: 'bg-blue-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-blue-600',
      scaleLabel: 'text-blue-900 font-semibold',
    },
  },
};

/**
 * Combined Mode - Point + Range selection
 *
 * Demonstrates using both point and range handles simultaneously.
 * Shows different label behaviors for each handle type.
 */
export const CombinedMode: Story = {
  render: Template,
  args: {
    mode: 'combined',
    value: {
      start: toUTCDate('2024-03-01'),
      end: toUTCDate('2024-09-01'),
      point: toUTCDate('2024-06-15'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 900,
      height: 90,
      dateLabelEnabled: true,
      dateLabelDistanceOverHandle: 40,
    },
    behavior: {
      pointHandleLabelPersistent: true,
      rangeHandleLabelPersistent: false,
      trackHoverDateLabelDisabled: true,
    },
    classNames: {
      trackActive: 'bg-purple-500/25',
      track: 'bg-gray-200',
      handlePoint: 'bg-purple-700 scale-110',
      handleStart: 'bg-purple-500',
      handleEnd: 'bg-purple-500',
    },
  },
};

/**
 * With UI Components - Full feature set
 *
 * Shows all optional UI components enabled.
 * Default renderers are provided - no custom renderProps needed!
 */
export const WithUIComponents: Story = {
  render: Template,
  args: {
    mode: 'combined',
    value: {
      start: toUTCDate('2024-03-01'),
      end: toUTCDate('2024-09-01'),
      point: toUTCDate('2024-06-15'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2025-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 850,
      height: 80,
      dateLabelEnabled: true,
      selectionPanelEnabled: true,
      timeUnitSelectionEnabled: true,
      minGapScaleUnits: 3,
    },
    behavior: {
      handleLabelPersistent: true,
      scrollable: true,
      sliderAutoScrollToPointHandleVisibleEnabled: true,
      step: {
        amount: 14,
        unit: 'day',
      },
    },
    classNames: {
      trackActive: 'bg-indigo-400/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-indigo-500',
      scaleLabel: 'text-indigo-900 font-medium',
    },
  },
};

/**
 * Custom Icons - Personalized handles
 *
 * Shows how to provide custom icons for handles.
 * Icons are optional - defaults are provided if not specified.
 */
export const CustomIcons: Story = {
  render: Template,
  args: {
    mode: 'combined',
    value: {
      point: toUTCDate('2024-06-15'),
      start: toUTCDate('2024-03-01'),
      end: toUTCDate('2024-09-01'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    icons: {
      point: <CircleIcon className="fill-red-600 text-red-600" />,
      range: <MoveHorizontalIcon className="text-blue-600" />,
    },
    layout: {
      width: 800,
      dateLabelEnabled: true,
    },
    behavior: {
      handleLabelPersistent: true,
    },
    classNames: {
      trackActive: 'bg-gradient-to-r from-blue-400/20 to-red-400/20',
      track: 'bg-gray-300',
    },
  },
};

/**
 * Timeline Style - Minimal scale marks for timeline displays
 *
 */
export const TimelineStyle: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: {
      point: toUTCDate('2024-12-04T10:52:00Z'),
    },
    min: toUTCDate('2024-11-03'),
    max: toUTCDate('2024-12-25'),
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 600,
      height: 80,
      scaleUnitConfig: {
        gap: 150,
        width: { short: 0, medium: 0, long: 2 },
        height: { short: 0, medium: 0, long: 40 },
      },
      dateLabelEnabled: true,
    },
    behavior: {
      scrollable: true,
      handleLabelPersistent: true,
    },
    classNames: {
      trackActive: 'bg-gradient-to-r from-blue-500 to-purple-500',
      track: 'bg-gray-200',
      trackInner: 'h-1 top-1/2 bg-red-400',
      handle: 'top-1/2 -translate-y-1/2',
      handlePoint: 'hover:scale-125 transition-transform',
      scaleLabel: 'text-gray-700 font-semibold -bottom-4',
    },
    dateFormat: {
      scale: ({ date }) => {
        const day = date.getUTCDate();
        return day === 1 ? 'MMM YYYY' : 'DD MMM';
      },
      label: () => 'DD-MMM-YYYY',
    },
  },
};

/**
 * Flexible Date Formats - Demonstrates various date format separators
 *
 * Shows that date formats now support any separator (/, ., comma+space, etc.)
 * The format string preserves whatever separator you use.
 */
export const FlexibleFormats: Story = {
  render: Template,
  args: {
    mode: 'combined',
    value: {
      point: toUTCDate('2024-06-15'),
      start: toUTCDate('2024-03-01'),
      end: toUTCDate('2024-09-01'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 700,
      dateLabelEnabled: true,
    },
    behavior: {
      handleLabelPersistent: true,
    },
    dateFormat: {
      scale: ({ date }) => {
        const day = date.getUTCDate();
        const month = date.getUTCMonth();

        if (day === 1 && month === 0) {
          return 'MMM YY';
        }
        if (day === 1) {
          return 'MMM';
        }
        return 'dd';
      },
      label: () => 'MMM DD, YYYY',
    },
    classNames: {
      trackActive: 'bg-indigo-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-indigo-400',
      scaleLabel: 'text-indigo-700 font-medium',
    },
  },
};

/**
 * Locale Support - French date formatting
 *
 * Demonstrates how to use different locales for date formatting.
 * Month and day names will be displayed in French.
 * Import the locale before using: `import 'dayjs/locale/fr'`
 */
export const LocaleSupport: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: {
      point: toUTCDate('2024-06-15'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2025-01-15'),
    initialTimeUnit: 'month' as TimeUnit,
    locale: 'fr', // French locale
    layout: {
      width: 700,
      height: 60,
      dateLabelEnabled: true,
    },
    behavior: {
      handleLabelPersistent: true,
    },
    dateFormat: {
      scale: ({ date }) => {
        const day = date.getUTCDate();
        const month = date.getUTCMonth();

        if (day === 1 && month === 0) {
          return 'YYYY';
        }
        if (day === 1) {
          return 'MMM';
        }
        return 'dd';
      },
      label: () => 'dddd, DD MMMM YYYY', // "samedi, 15 juin 2024"
    },
    classNames: {
      trackActive: 'bg-rose-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-rose-400',
      scaleLabel: 'text-rose-700 font-medium',
    },
  },
};

/**
 * Large Date Range - Performance test with virtualization
 *
 * Demonstrates performance with a 10-year range (3,650+ days).
 * Only visible scale marks and labels are rendered thanks to virtualization.
 * Without virtualization: 3,650+ DOM elements
 * With virtualization: ~150-200 DOM elements
 * Try scrolling - smooth performance even with massive date range!
 */
export const LargeDateRange: Story = {
  render: Template,
  args: {
    mode: 'range',
    value: {
      start: toUTCDate('2020-01-01'),
      end: toUTCDate('2022-12-31'),
    },
    min: toUTCDate('2015-01-01'),
    max: toUTCDate('2025-12-31'),
    initialTimeUnit: 'day' as TimeUnit,
    layout: {
      width: 800,
      height: 80,
      dateLabelEnabled: true,
    },
    behavior: {
      scrollable: true,
      handleLabelPersistent: true,
    },
    dateFormat: {
      scale: ({ date }) => {
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        if (day === 1 && month === 0) return 'YYYY';
        if (day === 1) return 'MMM';
        return '';
      },
      label: () => 'DD MMM YYYY',
    },
    classNames: {
      trackActive: 'bg-emerald-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-emerald-400',
      scaleLabel: 'text-emerald-700 font-medium',
    },
  },
};

/**
 * ## Hourly Granularity with Partial Custom Resolver
 *
 * Demonstrates hourly time unit with a partial custom scale type resolver.
 *
 * **Key Features:**
 * - Hour-based timeline (perfect for event scheduling, time tracking)
 * - Partial custom resolver: Only handles 'hour', returns undefined for other units
 * - When undefined is returned, falls back to default logic for day/month/year
 * - Custom emphasis: Every 6 hours gets 'long' scale, every 3 hours gets 'medium'
 *
 * **Try this:** Use the initialTimeUnit control to switch between hour/day/month/year.
 * The resolver gracefully falls back to defaults for non-hour units!
 */
export const HourlyWithCustomResolver: Story = {
  render: Template,
  args: {
    mode: 'range',
    value: {
      start: toUTCDate('2024-12-07T08:00:00Z'),
      end: toUTCDate('2024-12-07T16:00:00Z'),
    },
    min: toUTCDate('2024-12-07T00:00:00Z'),
    max: toUTCDate('2024-12-10T23:59:59Z'),
    initialTimeUnit: 'hour' as TimeUnit,
    scaleTypeResolver: (date, timeUnit) => {
      // Only customize hour timeUnit, return undefined for others to use defaults
      if (timeUnit === 'hour') {
        const hour = date.getUTCHours();
        if (hour % 6 === 0) return 'long'; // Every 6 hours
        if (hour % 3 === 0) return 'medium'; // Every 3 hours
        return 'short'; // Other hours
      }
    },
    layout: {
      width: 800,
      height: 60,
      dateLabelEnabled: true,
    },
    behavior: {
      scrollable: true,
      handleLabelPersistent: true,
    },
    dateFormat: {
      scale: ({ date }) => {
        const hour = date.getUTCHours();
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        if (month === 0 && day === 1 && hour === 0) return 'YYYY';
        if (hour === 0) return 'dd';
        if (hour % 3 === 0) return 'HH:mm';
        return '';
      },
      label: () => 'DD MMM YYYY HH:mm',
    },
    classNames: {
      trackActive: 'bg-purple-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-purple-600',
      scaleMarkMedium: 'bg-purple-400',
      scaleMarkMinor: 'bg-purple-200',
      scaleLabel: 'text-purple-700 font-semibold text-xs',
    },
  },
};

/**
 * Dynamic Step Configuration - Context-aware navigation
 *
 * Demonstrates using a callback function for the step configuration.
 * The step amount adapts based on the current timeUnit zoom level.
 */
export const DynamicStep: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: {
      point: toUTCDate('2024-06-15'),
    },
    min: toUTCDate('2024-01-01'),
    max: toUTCDate('2024-12-31'),
    initialTimeUnit: 'day',
    layout: {
      width: 900,
      height: 80,
      dateLabelEnabled: true,
      selectionPanelEnabled: true,
      timeUnitSelectionEnabled: true,
    },
    dateFormat: {
      scale: ({ date, unit }) => {
        const hour = date.getUTCHours();
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        if (month === 0 && day === 1 && hour === 0) return 'YYYY';
        if (day === 1 && hour === 0) return 'MMM ';
        if (hour === 0 && unit !== 'hour') return 'DD';
        if (hour === 0 && unit === 'hour') return 'dd';
        if (hour % 3 === 0) return 'HH:mm';
        return '';
      },
      label: ({ unit }) => {
        if (unit === 'hour') return 'DD MMM YYYY HH:mm';
        return 'DD MMM YYYY ';
      },
    },
    behavior: {
      scrollable: true,
      handleLabelPersistent: true,
      sliderAutoScrollToPointHandleVisibleEnabled: true,
      // Dynamic step that adapts to current unit
      step: ({ unit }) => {
        if (unit === 'hour') return { amount: 6, unit: 'hour' };
        if (unit === 'day') return { amount: 7, unit: 'day' };
        if (unit === 'month') return { amount: 3, unit: 'month' };
        if (unit === 'year') return { amount: 1, unit: 'year' };
        return { amount: 1, unit: unit };
      },
    },
    classNames: {
      trackActive: 'bg-emerald-500/30',
      track: 'bg-gray-200',
      scaleMarkMajor: 'bg-emerald-600',
      scaleLabel: 'text-emerald-700 font-medium',
    },
  },
};

/**
 * Custom Time Unit Selector - Render-prop primitives
 *
 * Instead of the built-in prev/next stepper, this builds a segmented control
 * from the primitives exposed to `renderTimeUnitSelection`:
 * `availableTimeUnits`, `selectTimeUnit`, and the `isMonthValid`/`isYearValid`
 * range-validity flags for per-unit disabling.
 */
export const CustomTimeUnitSelector: Story = {
  render: Template,
  args: {
    mode: 'point',
    value: {
      point: toUTCDate('2024-06-15'),
    },
    min: toUTCDate('2023-01-01'),
    max: toUTCDate('2025-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    layout: {
      width: 900,
      height: 80,
      dateLabelEnabled: true,
      selectionPanelEnabled: true,
      timeUnitSelectionEnabled: true,
    },
    behavior: {
      scrollable: true,
      handleLabelPersistent: true,
    },
    renderProps: {
      renderTimeUnitSelection: ({
        timeUnit,
        availableTimeUnits,
        selectTimeUnit,
        isMonthValid,
        isYearValid,
      }) => (
        <div className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-white p-1 shrink-0">
          {availableTimeUnits.map(unit => {
            const disabled =
              (unit === 'month' && !isMonthValid) || (unit === 'year' && !isYearValid);
            const active = unit === timeUnit;
            return (
              <button
                key={unit}
                disabled={disabled}
                aria-pressed={active}
                onClick={() => selectTimeUnit(unit)}
                className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                {unit}
              </button>
            );
          })}
        </div>
      ),
    },
  },
};
