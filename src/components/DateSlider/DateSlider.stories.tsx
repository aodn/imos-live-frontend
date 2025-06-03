import type { Meta, StoryObj } from '@storybook/react';
import { DateSlider } from './DateSlider';
import { SelectionResult, TimeUnit } from './type';
import { TriangleIcon } from '../Icons';

const RangeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <rect x="2" y="2" width="8" height="8" rx="1" />
  </svg>
);

const meta: Meta<typeof DateSlider> = {
  title: 'Components/DateSlider/DateSlider',
  component: DateSlider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable date slider component that supports range selection, point selection, or both combined.',
      },
    },
  },
  argTypes: {
    viewMode: {
      control: 'select',
      options: ['range', 'point', 'combined'],
      description: 'Selection mode for the slider',
    },
    initialTimeUnit: {
      control: 'select',
      options: ['day', 'month', 'year'],
      description: 'Initial time unit for the slider scale',
    },
    startDate: {
      control: 'date',
      description: 'Start date of the slider range',
    },
    endDate: {
      control: 'date',
      description: 'End date of the slider range',
    },
    scrollable: {
      control: 'boolean',
      description: 'Whether the slider track is scrollable',
    },
    isTrackFixedWidth: {
      control: 'boolean',
      description: 'Whether the track has a fixed width',
    },
    trackFixedWidth: {
      control: 'number',
      description: 'Fixed width for the track (when isTrackFixedWidth is true)',
    },
    minGapScaleUnits: {
      control: 'number',
      description: 'Minimum gap between range handles in scale units',
    },
    trackPaddingX: {
      control: 'number',
      description: 'Horizontal padding for the track',
    },
    sliderWidth: {
      control: 'number',
      description: 'Width of the slider container',
    },
    sliderHeight: {
      control: 'number',
      description: 'Height of the slider container',
    },
  },
  args: {
    startDate: new Date('2023-01-01'),
    endDate: new Date('2024-12-31'),
    initialTimeUnit: 'month' as TimeUnit,
    scrollable: true,
    isTrackFixedWidth: false,
    trackFixedWidth: 300,
    minGapScaleUnits: 3,
    trackPaddingX: 36,
    sliderHeight: 96,
    rangeHandleIcon: <RangeIcon />,
    pointHandleIcon: <TriangleIcon color="imos-grey" />,
    onChange: (selection: SelectionResult) => {
      console.log('Selection changed:', selection);
    },
    wrapperClassName: 'shadow-xl',
    sliderWidth: 300,
  },
  // Add this render function to handle date conversion
  render: args => {
    // Convert date controls to Date objects if they're not already
    const processedArgs = {
      ...args,
      startDate: args.startDate instanceof Date ? args.startDate : new Date(args.startDate),
      endDate: args.endDate instanceof Date ? args.endDate : new Date(args.endDate),
      // Also handle initial range and point dates if they exist
      ...(args.initialRange && {
        initialRange: {
          start:
            args.initialRange.start instanceof Date
              ? args.initialRange.start
              : new Date(args.initialRange.start),
          end:
            args.initialRange.end instanceof Date
              ? args.initialRange.end
              : new Date(args.initialRange.end),
        },
      }),
      ...(args.initialPoint && {
        initialPoint:
          args.initialPoint instanceof Date ? args.initialPoint : new Date(args.initialPoint),
      }),
    };

    return <DateSlider {...processedArgs} />;
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Stories
export const RangeMode: Story = {
  args: {
    viewMode: 'range',
    initialRange: {
      start: new Date('2023-06-01'),
      end: new Date('2023-09-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Range selection mode allows users to select a date range with start and end handles.',
      },
    },
  },
};

export const PointMode: Story = {
  args: {
    viewMode: 'point',
    initialPoint: new Date('2023-07-15'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Point selection mode allows users to select a single date point.',
      },
    },
  },
};

export const CombinedMode: Story = {
  args: {
    viewMode: 'combined',
    initialRange: {
      start: new Date('2023-04-01'),
      end: new Date('2023-08-01'),
    },
    initialPoint: new Date('2023-06-01'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Combined mode allows users to select both a date range and a single point.',
      },
    },
  },
};

// Time Unit Stories
export const DayTimeUnit: Story = {
  args: {
    viewMode: 'range',
    startDate: new Date('2023-07-01'),
    endDate: new Date('2023-07-31'),
    initialTimeUnit: 'day',
    initialRange: {
      start: new Date('2023-07-10'),
      end: new Date('2023-07-20'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with day-based time units for fine-grained date selection.',
      },
    },
  },
};

export const MonthTimeUnit: Story = {
  args: {
    viewMode: 'range',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2024-12-31'),
    initialTimeUnit: 'month',
    initialRange: {
      start: new Date('2023-03-01'),
      end: new Date('2023-09-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with month-based time units for medium-term date selection.',
      },
    },
  },
};

export const YearTimeUnit: Story = {
  args: {
    viewMode: 'range',
    startDate: new Date('2020-02-01'),
    endDate: new Date('2036-12-10'),
    initialTimeUnit: 'year',
    initialRange: {
      start: new Date('2022-01-01'),
      end: new Date('2025-07-02'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with year-based time units for long-term date selection.',
      },
    },
  },
};

// Layout and Sizing Stories
export const FixedWidthTrack: Story = {
  args: {
    viewMode: 'range',
    isTrackFixedWidth: true,
    trackFixedWidth: 400,
    scrollable: true,
    initialRange: {
      start: new Date('2023-03-01'),
      end: new Date('2023-09-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with a fixed-width track that allows scrolling.',
      },
    },
  },
};

export const NonScrollable: Story = {
  args: {
    viewMode: 'range',
    scrollable: false,
    sliderWidth: 600,
    initialRange: {
      start: new Date('2023-04-01'),
      end: new Date('2023-08-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with scrolling disabled and a specific width.',
      },
    },
  },
};

export const LargeSize: Story = {
  args: {
    viewMode: 'range',
    sliderWidth: 800,
    sliderHeight: 120,
    trackPaddingX: 60,
    initialRange: {
      start: new Date('2023-02-01'),
      end: new Date('2023-10-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Large version of the date slider with increased dimensions.',
      },
    },
  },
};

// Configuration Stories
export const TightGapConstraint: Story = {
  args: {
    viewMode: 'range',
    minGapScaleUnits: 1,
    initialTimeUnit: 'day',
    startDate: new Date('2023-07-01'),
    endDate: new Date('2023-07-31'),
    initialRange: {
      start: new Date('2023-07-10'),
      end: new Date('2023-07-12'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with a tight minimum gap constraint between range handles.',
      },
    },
  },
};

export const LooseGapConstraint: Story = {
  args: {
    viewMode: 'range',
    minGapScaleUnits: 10,
    initialRange: {
      start: new Date('2023-02-01'),
      end: new Date('2024-01-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with a loose minimum gap constraint between range handles.',
      },
    },
  },
};

export const LongDateRange: Story = {
  args: {
    viewMode: 'range',
    startDate: new Date('2000-01-01'),
    endDate: new Date('2050-12-31'),
    initialTimeUnit: 'year',
    initialRange: {
      start: new Date('2020-01-01'),
      end: new Date('2030-01-01'),
    },
    sliderWidth: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with a very long date range (50 years).',
      },
    },
  },
};

// Interactive Examples
export const WithCustomScaleConfig: Story = {
  args: {
    viewMode: 'range',
    scaleUnitConfig: {
      gap: 8,
      width: { short: 1, medium: 3, long: 4 },
      height: { short: 6, medium: 12, long: 48 },
    },
    initialRange: {
      start: new Date('2023-03-01'),
      end: new Date('2023-09-01'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Date slider with custom scale configuration for different visual appearance.',
      },
    },
  },
};
