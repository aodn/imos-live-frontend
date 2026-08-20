# DateSlider

A self-contained date range / point selector. Designed to be extractable into
its own npm package without code changes.

## Self-contained convention

**Nothing inside `src/components/DateSlider/` imports from `@/utils`, `@/hooks`,
`@/constants`, `@/components`, or any other app-level path.** The only allowed
non-relative imports are genuine npm packages (`react`, `react-dom`,
`lucide-react`, `dayjs`, `clsx`, `tailwind-merge`).

If you need a utility or hook that already exists at the app level, **copy it**
into `./utils/` or `./hooks/` rather than importing it. Yes, this means some
files (`cn`, `clamp`, `useDrag`, `useResizeObserver`, …) are duplicated between
this package and `src/utils/` / `src/hooks/`. That's intentional — the cost of
duplication is paid here in exchange for the package being lift-and-shift
portable. Fix bugs in both places, or extract first.

If you're tempted to "dedupe" by pointing imports at `@/utils` or `@/hooks` to
remove the duplicates, **don't** — that breaks the contract above and
re-introduces the half-encapsulation this layout was deliberately set up to
avoid.

## Public surface

`index.ts` is the **only door** — a curated allowlist, not a wildcard. External
callers import from the package root:

```ts
import { DateSlider, type SliderProps } from '@/components/DateSlider';
```

> Note: DateSlider is **not** re-exported from the `@/components` barrel — import
> it from `@/components/DateSlider` (or a relative path to that folder).

`index.ts` re-exports exactly one component (`DateSlider`), the default
date-label renderer (`customDateLabelRenderer`), the state-store helpers
(`createDateSliderStore`, `useDateSliderStore`, `useDateSliderState`), and the
public types. The internal building-block components (`SliderTrack`,
`SliderHandle`, `ScalesUnitLabels`) and everything under `./hooks/` and
`./utils/` are deliberately **not** exported. The barrel enforces this — it lists
named exports rather than `export *`, so adding a public symbol is a conscious
edit here.

## Usage

```tsx
import { DateSlider, type SliderExposedMethod, type PointValue } from '@/components/DateSlider';

const ref = useRef<SliderExposedMethod>(null);

<DateSlider
  mode="point"
  min={startDate} // UTC Date
  max={endDate} // UTC Date
  value={{ point: date }}
  initialTimeUnit="day"
  imperativeRef={ref}
  onChange={v => setDate((v as PointValue).point)}
  layout={{ width: 'fill', height: 64, dateLabelEnabled: true }}
  behavior={{ scrollable: true }}
/>;

// Imperative control (e.g. "jump to latest available date")
ref.current?.setDateTime(new Date('2024-06-15'));
```

> **All dates are UTC.** `min`, `max`, `value`, and everything `onChange` returns are UTC `Date`s — pass UTC in, expect UTC out.

## ⚠️ Timezone model — read this before wiring up dates

**Every internal calculation reads a `Date`'s `getUTC*` fields, and every position
calculation is pure epoch-ms arithmetic (`.getTime()` diffs).** The slider never
touches `getMonth()`, `getHours()`, `Intl`, or the browser's local timezone. That
has two consequences:

1. **A JS `Date` has no timezone — only an instant.** "UTC" here doesn't mean the
   slider forces real-world UTC; it means the slider reads whatever values sit in
   the `Date`'s UTC-labeled fields. You control what goes into those fields.
2. **This makes the slider effectively timezone-agnostic, not UTC-only.** You can
   represent _any_ timezone by encoding that timezone's wall-clock time into the
   `Date`'s UTC fields — e.g. `Date.UTC(y, m, d, h)` or an ISO string ending in
   `Z` — and reading `onChange`'s result back the same way (`getUTC*`, or this
   package's `toISODateString`). The slider will tick, scroll, and label
   correctly no matter what real-world timezone those numbers are supposed to
   represent, because it never asks the environment what timezone it's in.

**The one way to break this:** don't pass ISO strings with a real UTC offset
(e.g. `2024-06-15T00:00:00+10:00`) into `min`/`max`/`value`. `new Date(...)`
will correctly convert that to a true UTC instant, and `getUTC*` will then
return the _converted_ UTC hour — not your original +10 wall-clock hour. Always
feed the slider `Z`-suffixed (or bare-date, which callers commonly zero-pad to
midnight `Z`) strings that already encode the exact field values you want back
out. In short: **encode, don't convert.**

### Worked example: driving the slider in a non-UTC timezone

Say you want the slider to represent **Sydney local time (AEST, UTC+10)**
instead of real UTC — e.g. a range from 9am to 5pm Sydney time on 15 June 2024.
Don't pass the real UTC instant for those wall-clock times (`23:00`/`07:00`
UTC the day before/of) — encode the Sydney wall-clock numbers directly into the
`Date`'s UTC fields instead:

```tsx
// ❌ Don't do this — real UTC offset gets converted, so getUTC*() no longer
// matches the Sydney wall-clock time you meant:
const min = new Date('2024-06-15T09:00:00+10:00'); // becomes 2024-06-14T23:00:00Z internally

// ✅ Do this — encode the Sydney wall-clock time directly as if it were UTC:
const min = new Date(Date.UTC(2024, 5, 15, 9, 0)); // "2024-06-15T09:00:00Z", read as 9am Sydney
const max = new Date(Date.UTC(2024, 5, 15, 17, 0)); // read as 5pm Sydney

<DateSlider
  mode="point"
  min={min}
  max={max}
  value={{ point: min }}
  initialTimeUnit="hour"
  onChange={v => {
    const p = (v as PointValue).point;
    // Decode the same way you encoded: getUTC*() fields ARE the Sydney
    // wall-clock fields, not real UTC.
    console.log(`Selected ${p.getUTCHours()}:00 Sydney time`); // e.g. "Selected 13:00 Sydney time"
  }}
/>;
```

The slider itself never knows or cares that these numbers mean "Sydney" — it
just ticks hours, scrolls, and reports positions from the epoch-ms span between
`min` and `max`. The timezone meaning exists only at the edges: in how you
construct `min`/`max`/`value`, and in how you interpret `onChange`'s result.
Mixing conventions (e.g. encoding `min` as Sydney time but reading `onChange`'s
result as real UTC) will silently produce the wrong wall-clock time — always
encode and decode with the same convention.

This app's current usage (`useDateSliderDates.ts` → `DateSelectionBar.tsx`)
happens to use real UTC, because the underlying satellite data (IMOS) is
genuinely date-only / UTC-midnight. That's a property of this app's data, not
a constraint of the slider itself.

## API

### Mode (discriminated union on `mode`)

`SliderProps` is a union — `mode` selects the variant and constrains `value` and `icons`:

| `mode`       | `value` shape                             | Icons used        |
| ------------ | ----------------------------------------- | ----------------- |
| `'point'`    | `{ point: Date }`                         | `point`           |
| `'range'`    | `{ start: Date; end: Date }`              | `range`           |
| `'combined'` | `{ point: Date; start: Date; end: Date }` | `point` + `range` |

`value` is optional in every mode (defaults to `min`/`max`). `onChange` receives the matching `SliderValue`.

### Common props

| Prop                | Type                                   | Notes                                                    |
| ------------------- | -------------------------------------- | -------------------------------------------------------- |
| `min` / `max`       | `Date` (UTC, required)                 | Bounds of the timeline                                   |
| `initialTimeUnit`   | `'hour' \| 'day' \| 'month' \| 'year'` | Initial zoom granularity                                 |
| `onChange`          | `(value: SliderValue) => void`         | Fires on selection change                                |
| `imperativeRef`     | `Ref<SliderExposedMethod>`             | External control — see below                             |
| `stateStore`        | `DateSliderStore`                      | Publishes live state for sibling controls — see below    |
| `classNames`        | `DateSliderClassNames`                 | Per-element Tailwind overrides                           |
| `behavior`          | `BehaviorConfig`                       | Scrolling, step, label persistence, free track selection |
| `layout`            | `LayoutConfig`                         | Width/height, padding, which sub-components render       |
| `renderProps`       | `RenderPropsConfig`                    | Custom date-label renderer                               |
| `dateFormat`        | `DateFormat`                           | dayjs format tokens for scale marks vs handle labels     |
| `locale`            | `string` (default `'en'`)              | Requires `import 'dayjs/locale/<code>'` first            |
| `scaleTypeResolver` | `ScaleTypeResolver`                    | Custom short/medium/long classification of scale marks   |

### Imperative API (`SliderExposedMethod`)

Reach the handle via `imperativeRef`:

| Method                           | Purpose                                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| `setDateTime(date, target?)`     | Set a handle to a UTC date (`target`: `'start' \| 'end' \| 'point'`) |
| `moveByStep(direction, target?)` | Move by the configured `behavior.step`                               |
| `setTimeUnit(timeUnit)`          | Change the active granularity (resets scroll, re-centres the handle) |
| `focusHandle(handleType)`        | Programmatically focus a handle                                      |

### Render props (`RenderPropsConfig`)

Override a sub-component's markup while keeping the slider's behaviour:

| Renderer          | Key props |
| ----------------- | --------- |
| `renderDateLabel` | `label`   |

The slider renders only the track, handles, and floating date labels. The date
panel and time-unit selector are **not** part of the slider — drive them as
sibling components via the state store (below).

### External state store (`useDateSliderStore` / `useDateSliderState`)

The slider owns its state but publishes it outward so controls rendered as
**siblings** — a date panel, a time-unit selector — can read it live (e.g. to
keep the date panel pinned while the slider collapses). The slider stays the
source of truth; siblings read via the store and write back via the imperative
handle.

```tsx
import {
  DateSlider,
  useDateSliderStore,
  useDateSliderState,
  type SliderExposedMethod,
} from '@/components/DateSlider';

const sliderRef = useRef<SliderExposedMethod>(null);
const store = useDateSliderStore('day'); // stable for the component's lifetime

// In a sibling control — only this component re-renders as state changes:
const { pointDate, timeUnit, isMonthValid, isYearValid } = useDateSliderState(store);

<DateSlider imperativeRef={sliderRef} stateStore={store} /* … */ />;
```

- `useDateSliderState(store)` is backed by `useSyncExternalStore`, so only the
  components that call it re-render on change — not the slider or its parent.
- The published `pointDate` is **not** debounced (unlike `onChange`), so a
  sibling date label stays live during a drag.
- Drive the slider back from siblings via the imperative handle —
  `sliderRef.current?.moveByStep(…)` and `sliderRef.current?.setTimeUnit(…)`.
- `createDateSliderStore` is the non-hook factory (for tests/stories).

> `DateSelectionBar` (the app's consumer) uses exactly this pattern: a pinned
> `DateSelectionPanel` and a `TimeUnitSelector` rendered as siblings of the slider.

## Layout

- `components/` — `DateSlider`, `DateSliderWrapper`, `SliderTrack`,
  `SliderHandle`, `DateLabel`, `ScalesUnitLabels`, and the default date-label
  renderer.
- `store/` — `dateSliderStore.ts` (external live-state store + hooks).
- `hooks/` — drag, position, scroll, scaling, dimensions, focus, debouncing.
- `utils/` — pure helpers (`cn`, `clamp`, `debounce`, …) plus
  `dateSliderUtils.ts` for slider-specific date math.
- `constants.ts` — layout / timing / accessibility magic-number registry,
  including `BREAKPOINT` for `useViewportSize`.
- `type.ts` — public types.
