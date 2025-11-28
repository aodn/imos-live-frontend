# DateSlider Component

A flexible, timezone-safe date selection component for React that supports point, range, and combined selection modes with UTC-first architecture.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Principles](#core-principles)
- [Quick Start](#quick-start)
- [Date Handling](#date-handling)
- [API Reference](#api-reference)
- [Granularity System](#granularity-system)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### UTC-First Design

DateSlider follows a **"UTC Everywhere, Display Locally"** architecture:

```
┌─────────────────────────────────────────────────────────┐
│  CONSUMER LAYER (Your Code)                             │
│  - Store dates as strings: "2024-01-15"                 │
│  - Use helper utilities to convert                      │
└─────────────────┬───────────────────────────────────────┘
                  │ toUTCDate()
                  ↓
┌─────────────────────────────────────────────────────────┐
│  DATESLIDER (UTC Dates Only)                            │
│  - All Date props must be UTC Date objects              │
│  - All calculations use UTC methods                     │
│  - Single source of truth                               │
└─────────────────┬───────────────────────────────────────┘
                  │ formatForDisplay()
                  ↓
┌─────────────────────────────────────────────────────────┐
│  DISPLAY LAYER (User Interface)                         │
│  - Formats dates for visual display                     │
│  - Shows dates in UTC (configurable locale)             │
└─────────────────────────────────────────────────────────┘
```

### Why UTC?

1. **Unambiguous**: No DST or timezone confusion
2. **Consistent**: Same timestamp for all users globally
3. **Scalable**: Works for days, hours, minutes
4. **Future-proof**: Adding time granularity requires zero changes
5. **Standard**: What all modern date libraries expect

---

## Core Principles

### 1. Strict UTC Contract

**DateSlider ONLY accepts UTC Date objects:**

```typescript
// ✅ CORRECT
<DateSlider
  startDate={toUTCDate('2024-01-01')}
  endDate={toUTCDate('2024-12-31')}
/>

// ❌ WRONG - Will cause timezone bugs
<DateSlider
  startDate={new Date('2024-01-01')}  // Creates local midnight
  endDate={new Date('2024-12-31')}
/>
```

### 2. Consumers Handle Conversion

**You convert your data, not the component:**

```typescript
// Your data (strings from API/store)
const dateString = "2024-01-15";

// Convert before passing to DateSlider
const utcDate = toUTCDate(dateString);

// Convert back when receiving
onChange={(selection) => {
  const dateString = toISODateString(selection.point);
  // → "2024-01-15"
}}
```

### 3. Date-Only = UTC Midnight

For daily granularity, dates represent **UTC midnight**:

```typescript
toUTCDate('2024-01-15');
// → Date("2024-01-15T00:00:00.000Z")
```

---

## Quick Start

### Installation

```typescript
import { DateSlider } from '@/components/DateSlider';
import { toUTCDate, toISODateString } from '@/components/DateSlider/utils';
```

### Basic Usage (Point Mode)

```typescript
function MyComponent() {
  const [selectedDate, setSelectedDate] = useState("2024-06-15");

  return (
    <DateSlider
      viewMode="point"
      initialTimeUnit="day"
      granularity="day"
      startDate={toUTCDate('2024-01-01')}
      endDate={toUTCDate('2024-12-31')}
      initialPoint={toUTCDate(selectedDate)}
      onChange={(selection) => {
        if ('point' in selection) {
          const dateStr = toISODateString(selection.point);
          setSelectedDate(dateStr);
        }
      }}
    />
  );
}
```

### Range Mode

```typescript
<DateSlider
  viewMode="range"
  initialTimeUnit="month"
  granularity="day"
  startDate={toUTCDate('2024-01-01')}
  endDate={toUTCDate('2024-12-31')}
  initialRange={{
    start: toUTCDate('2024-03-01'),
    end: toUTCDate('2024-06-30'),
  }}
  onChange={(selection) => {
    if ('range' in selection) {
      const startStr = toISODateString(selection.range.start);
      const endStr = toISODateString(selection.range.end);
      console.log(`Selected: ${startStr} to ${endStr}`);
    }
  }}
/>
```

---

## Date Handling

### Helper Utilities

#### `toUTCDate(dateString: string): Date`

Converts ISO date strings to UTC Date objects.

```typescript
// Date-only strings → UTC midnight
toUTCDate('2024-01-15');
// → Date("2024-01-15T00:00:00.000Z")

// ISO datetime strings → preserved
toUTCDate('2024-01-15T14:30:00Z');
// → Date("2024-01-15T14:30:00.000Z")
```

**Use this when:**

- Passing date strings to DateSlider props
- Converting API/store date strings

#### `toISODateString(date: Date): string`

Converts UTC Date to ISO date string (YYYY-MM-DD).

```typescript
const date = toUTCDate('2024-01-15');
toISODateString(date);
// → "2024-01-15"
```

**Use this when:**

- Converting DateSlider output back to strings
- Sending dates to backend APIs

#### `toISODateTimeString(date: Date): string`

Converts UTC Date to ISO datetime string (YYYY-MM-DDTHH:mm:ss).

```typescript
const date = new Date('2024-01-15T14:30:00Z');
toISODateTimeString(date);
// → "2024-01-15T14:30:00"
```

**Use this when:**

- Working with hourly/minute granularity
- Need full datetime strings

#### `addTime(date: Date, amount: number, unit: string): Date`

Adds time to a UTC date.

```typescript
const date = toUTCDate('2024-01-15');
addTime(date, 5, 'day');
// → Date("2024-01-20T00:00:00.000Z")

addTime(date, 2, 'month');
// → Date("2024-03-15T00:00:00.000Z")

addTime(date, 3, 'hour');
// → Date("2024-01-15T03:00:00.000Z")
```

#### `formatForDisplay(date: Date, granularity: DateGranularity, locale?: string, fullDate?: boolean): string`

Formats UTC dates for display.

```typescript
const date = toUTCDate('2024-01-15');

formatForDisplay(date, 'day', 'en-AU', true);
// → "15 Jan 2024"

formatForDisplay(date, 'day', 'en-AU', false);
// → "15" (or "Jan" if 1st of month, or "2024" if Jan 1st)
```

---

## API Reference

### Props

| Prop                  | Type                                   | Required | Description                                   |
| --------------------- | -------------------------------------- | -------- | --------------------------------------------- |
| `viewMode`            | `'point' \| 'range' \| 'combined'`     | ✅       | Selection mode                                |
| `startDate`           | `Date`                                 | ✅       | Start of date range (UTC)                     |
| `endDate`             | `Date`                                 | ✅       | End of date range (UTC)                       |
| `initialTimeUnit`     | `'day' \| 'month' \| 'year'`           | ✅       | Initial scale unit                            |
| `granularity`         | `'day' \| 'hour' \| 'minute'`          | ❌       | Display granularity (default: `'day'`)        |
| `initialPoint`        | `Date`                                 | ❌       | Initial point position (UTC)                  |
| `initialRange`        | `{ start: Date, end: Date }`           | ❌       | Initial range (UTC)                           |
| `onChange`            | `(selection: SelectionResult) => void` | ✅       | Selection change callback                     |
| `scrollable`          | `boolean`                              | ❌       | Enable horizontal scrolling (default: `true`) |
| `sliderWidth`         | `'fill' \| number`                     | ❌       | Slider width                                  |
| `sliderHeight`        | `number`                               | ❌       | Slider height in pixels                       |
| `imperativeHandleRef` | `React.Ref<SliderExposedMethod>`       | ❌       | Ref for imperative API                        |

### Selection Result Types

```typescript
// Point mode
type PointSelection = {
  point: Date; // UTC Date
};

// Range mode
type RangeSelection = {
  range: {
    start: Date; // UTC Date
    end: Date; // UTC Date
  };
};

// Combined mode
type CombinedSelection = PointSelection & RangeSelection;
```

### Imperative API

```typescript
const sliderRef = useRef<SliderExposedMethod>(null);

// Set date programmatically
sliderRef.current?.setDateTime(toUTCDate('2024-07-01'), 'point');

// Focus a handle
sliderRef.current?.focusHandle('point');

<DateSlider
  imperativeHandleRef={sliderRef}
  // ... other props
/>
```

---

## Granularity System

The `granularity` prop controls display precision and increment behavior.

### Day Granularity (Default)

```typescript
granularity = 'day';
```

- **Display**: "15 Jan 2024"
- **Increment**: ±1 day
- **Data**: UTC midnight (00:00:00)
- **Use case**: Daily data, reports, calendars

### Hour Granularity (Future)

```typescript
granularity = 'hour';
```

- **Display**: "15 Jan 2024, 14:00"
- **Increment**: ±1 hour
- **Data**: UTC hour (HH:00:00)
- **Use case**: Hourly data, timelines, schedules

### Minute Granularity (Future)

```typescript
granularity = 'minute';
```

- **Display**: "15 Jan 2024, 14:30:00"
- **Increment**: ±1 minute
- **Data**: UTC minute (HH:MM:00)
- **Use case**: High-resolution data, logs

### TimeUnit vs Granularity

**`timeUnit`**: Controls the **scale marks** on the slider

- Values: `'day' | 'month' | 'year'`
- Affects: Visual scale density, zoom level

**`granularity`**: Controls the **data precision** and display format

- Values: `'day' | 'hour' | 'minute'`
- Affects: Display format, increment buttons, data structure

**Example:**

```typescript
// Monthly view with daily precision
initialTimeUnit = 'month'; // Show month-level scales
granularity = 'day'; // But select specific days

// Yearly view with monthly precision
initialTimeUnit = 'year'; // Show year-level scales
granularity = 'month'; // But select specific months
```

---

## Examples

### Example 1: Simple Date Picker

```typescript
import { DateSlider } from '@/components/DateSlider';
import { toUTCDate, toISODateString } from '@/components/DateSlider/utils';

function DatePicker() {
  const [date, setDate] = useState("2024-06-15");

  return (
    <DateSlider
      viewMode="point"
      initialTimeUnit="day"
      granularity="day"
      startDate={toUTCDate('2024-01-01')}
      endDate={toUTCDate('2024-12-31')}
      initialPoint={toUTCDate(date)}
      onChange={(selection) => {
        const dateStr = toISODateString(selection.point);
        setDate(dateStr);
      }}
    />
  );
}
```

### Example 2: Date Range Selector

```typescript
function DateRangePicker() {
  const [range, setRange] = useState({
    start: "2024-03-01",
    end: "2024-06-30",
  });

  return (
    <DateSlider
      viewMode="range"
      initialTimeUnit="month"
      granularity="day"
      startDate={toUTCDate('2024-01-01')}
      endDate={toUTCDate('2024-12-31')}
      initialRange={{
        start: toUTCDate(range.start),
        end: toUTCDate(range.end),
      }}
      onChange={(selection) => {
        if ('range' in selection) {
          setRange({
            start: toISODateString(selection.range.start),
            end: toISODateString(selection.range.end),
          });
        }
      }}
    />
  );
}
```

### Example 3: With Custom Hook

```typescript
// Custom hook for date management
function useDateSlider(initialDate: string) {
  const [date, setDate] = useState(initialDate);

  const utcDate = useMemo(() => toUTCDate(date), [date]);

  const handleChange = useCallback((selection: PointSelection) => {
    const dateStr = toISODateString(selection.point);
    setDate(dateStr);
  }, []);

  return { date, utcDate, handleChange };
}

// Usage
function MyComponent() {
  const { utcDate, handleChange } = useDateSlider('2024-06-15');

  return (
    <DateSlider
      viewMode="point"
      initialTimeUnit="day"
      startDate={toUTCDate('2024-01-01')}
      endDate={toUTCDate('2024-12-31')}
      initialPoint={utcDate}
      onChange={handleChange}
    />
  );
}
```

### Example 4: Imperative Control

```typescript
function ControlledDateSlider() {
  const sliderRef = useRef<SliderExposedMethod>(null);

  const jumpToToday = () => {
    const today = new Date();
    const utcToday = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ));
    sliderRef.current?.setDateTime(utcToday, 'point');
  };

  return (
    <>
      <button onClick={jumpToToday}>Jump to Today</button>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={toUTCDate('2024-01-01')}
        endDate={toUTCDate('2024-12-31')}
        imperativeHandleRef={sliderRef}
        onChange={console.log}
      />
    </>
  );
}
```

---

## Migration Guide

### From Previous DateSlider Version

**Before (Flexible Input):**

```typescript
<DateSlider
  startDate="2024-01-01"  // String accepted
  endDate={new Date('2024-12-31')}  // Any Date accepted
  initialPoint={1705276800000}  // Timestamp accepted
/>
```

**After (Strict UTC):**

```typescript
<DateSlider
  startDate={toUTCDate('2024-01-01')}  // Must convert to UTC
  endDate={toUTCDate('2024-12-31')}    // Must convert to UTC
  initialPoint={toUTCDate('2024-01-15')}  // Must convert to UTC
/>
```

### From Other Date Components

**If using dayjs/moment:**

```typescript
// Before
const date = dayjs('2024-01-15');

// After
const utcDate = toUTCDate('2024-01-15');
```

**If using native Date:**

```typescript
// Before
const date = new Date('2024-01-15'); // Local midnight

// After
const utcDate = toUTCDate('2024-01-15'); // UTC midnight
```

---

## Troubleshooting

### Issue: Dates are off by one day

**Cause:** Passing local Date objects instead of UTC Dates

```typescript
// ✅ CORRECT - Creates UTC midnight
const date = toUTCDate('2024-01-15');
// Always: "2024-01-15T00:00:00Z"
```

**Solution:** Always use `toUTCDate()` for string dates

### Issue: TimeDisplay buttons don't work

**Cause:** Using old dual-API approach

```typescript
// ✅ CORRECT - Use single setDateTime
setDateTime(newDate, 'point');
```

### Issue: TypeScript errors with date props

**Cause:** Trying to pass strings directly

```typescript
// ❌ WRONG
<DateSlider startDate="2024-01-01" />
// Error: Type 'string' is not assignable to type 'Date'

// ✅ CORRECT
<DateSlider startDate={toUTCDate('2024-01-01')} />
```

### Issue: Display shows wrong timezone

**Cause:** Using local timezone methods

```typescript
// ❌ WRONG
date.getDate(); // Uses local timezone

// ✅ CORRECT (inside DateSlider)
date.getUTCDate(); // Uses UTC
```

---

## Best Practices

### 1. Store Dates as Strings

```typescript
// ✅ GOOD - Store as ISO strings
const [date, setDate] = useState('2024-01-15');

// ❌ BAD - Storing Date objects loses timezone info
const [date, setDate] = useState(new Date());
```

### 2. Convert at Boundaries

```typescript
// Convert TO UTC at component boundary
<DateSlider
  initialPoint={toUTCDate(dateString)}
  onChange={(selection) => {
    // Convert FROM UTC at callback boundary
    const str = toISODateString(selection.point);
    saveTo Backend(str);
  }}
/>
```

### 3. Use Memoization for Performance

```typescript
const startDate = useMemo(() => toUTCDate(startDateString), [startDateString]);
const endDate = useMemo(() => toUTCDate(endDateString), [endDateString]);
```

### 4. Type Your Callbacks

```typescript
const handleChange = useCallback((selection: SelectionResult) => {
  if ('point' in selection) {
    // TypeScript knows this is PointSelection
    const date = selection.point;
  }
}, []);
```

---

## Contributing

When contributing to DateSlider:

1. **Never use local timezone methods** inside the component

   - ✅ Use: `getUTCDate()`, `getUTCMonth()`, `Date.UTC()`
   - ❌ Avoid: `getDate()`, `getMonth()`, `new Date(year, month, day)`

2. **All new date operations must be UTC-first**
3. **Update this documentation** for any API changes
4. **Add tests** for timezone edge cases

---

## License

MIT
