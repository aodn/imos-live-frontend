# DatePicker

A self-contained, UTC-only month-grid date picker. A calendar-icon trigger opens
a frosted popover with month/year dropdowns, prev/next arrows, and a day grid.
The popover is portaled to `document.body` so an ancestor's `overflow-hidden`
can't clip it. Styling matches the DateSlider bar by default and is fully
themeable.

## Usage

```tsx
import { DatePicker } from '@/components';

<DatePicker
  value={date} // UTC Date
  min={startDate} // UTC, inclusive
  max={endDate} // UTC, exclusive — one day past the last selectable day
  onChange={next => setDate(next)} // next is midnight UTC
/>;
```

All dates are UTC. `onChange` always receives midnight UTC for the chosen day.

## Availability modes

Pass **exactly one** of these (passing both `min`/`max` and `dateList` throws):

| Mode              | Props         | Behavior                                                                                         |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| **Range**         | `min` + `max` | Every day within the contiguous `[min, max)` range is selectable (`max` exclusive).              |
| **List**          | `dateList`    | Only the listed dates are selectable; empty months/years are disabled, and the arrows skip gaps. |
| **Unconstrained** | _(none)_      | Every date is selectable (bounds open out to a wide window around `value`).                      |

## Props

| Prop               | Type                   | Default              | Notes                                               |
| ------------------ | ---------------------- | -------------------- | --------------------------------------------------- |
| `value`            | `Date`                 | —                    | Selected date (UTC). Required.                      |
| `onChange`         | `(date: Date) => void` | —                    | Receives midnight UTC. Required.                    |
| `min` / `max`      | `Date`                 | —                    | Range mode (UTC; `min` inclusive, `max` exclusive). |
| `dateList`         | `Date[]`               | —                    | List mode (UTC). Memoize if passing inline.         |
| `placement`        | `'top' \| 'bottom'`    | `'top'`              | Side the popover opens toward.                      |
| `icon`             | `ReactNode`            | calendar icon        | Custom trigger content.                             |
| `triggerAriaLabel` | `string`               | `'Open date picker'` | Accessible label for the trigger.                   |
| `monthFormat`      | `string`               | `'MMMM'`             | dayjs token for the month dropdown labels.          |
| `className`        | `string`               | —                    | Shorthand for `classNames.root`.                    |
| `classNames`       | `DatePickerClassNames` | —                    | Per-slot overrides (see below).                     |

## Styling (`classNames`)

Each slot is merged over the component's default with `cn`, so overrides win
without losing layout. Structural classes (portal positioning, grid layout) stay
internal.

`root`, `trigger`, `popover`, `header`, `navButton`, `monthSelect`, `yearSelect`,
`weekday`, `day`, `dayOutsideMonth`, `daySelected`, `dayDisabled`.

## Public surface

`index.ts` is a curated allowlist — only `DatePicker`, `DatePickerProps`, and
`DatePickerClassNames` are exported. Internal helpers (the availability model,
`HeaderSelect`, the per-mode prop arms) are implementation details.
