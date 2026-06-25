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

`index.ts` re-exports exactly one component (`DateSlider`), the default renderers
(`customDateLabelRenderer`, `customSelectionPanelRenderer`,
`customTimeUnitSelectionRenderer`), the state-store helpers
(`createDateSliderStore`, `useDateSliderStore`, `useDateSliderState`), and the
public types. The internal building-block components (`SliderTrack`,
`SliderHandle`, `SelectionPanel`, `ScalesUnitLabels`, `TimeUnitSelection`) and
everything under `./hooks/` and `./utils/` are deliberately **not** exported. The
barrel enforces this — it lists named exports rather than `export *`, so adding a
public symbol is a conscious edit here.

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
  layout={{ width: 'fill', height: 64, selectionPanelEnabled: true }}
  behavior={{ scrollable: true }}
/>;

// Imperative control (e.g. "jump to latest available date")
ref.current?.setDateTime(new Date('2024-06-15'));
```

> **All dates are UTC.** `min`, `max`, `value`, and everything `onChange` returns are UTC `Date`s — pass UTC in, expect UTC out.

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

| Prop                | Type                                   | Notes                                                     |
| ------------------- | -------------------------------------- | --------------------------------------------------------- |
| `min` / `max`       | `Date` (UTC, required)                 | Bounds of the timeline                                    |
| `initialTimeUnit`   | `'hour' \| 'day' \| 'month' \| 'year'` | Initial zoom granularity                                  |
| `onChange`          | `(value: SliderValue) => void`         | Fires on selection change                                 |
| `imperativeRef`     | `Ref<SliderExposedMethod>`             | External control — see below                              |
| `stateStore`        | `DateSliderStore`                      | Publishes live state for sibling controls — see below     |
| `classNames`        | `DateSliderClassNames`                 | Per-element Tailwind overrides                            |
| `behavior`          | `BehaviorConfig`                       | Scrolling, step, label persistence, free track selection  |
| `layout`            | `LayoutConfig`                         | Width/height, padding, which sub-components render        |
| `renderProps`       | `RenderPropsConfig`                    | Custom date-label / selection-panel / time-unit renderers |
| `dateFormat`        | `DateFormat`                           | dayjs format tokens for scale marks vs handle labels      |
| `locale`            | `string` (default `'en'`)              | Requires `import 'dayjs/locale/<code>'` first             |
| `scaleTypeResolver` | `ScaleTypeResolver`                    | Custom short/medium/long classification of scale marks    |

### Imperative API (`SliderExposedMethod`)

Reach the handle via `imperativeRef`:

| Method                           | Purpose                                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| `setDateTime(date, target?)`     | Set a handle to a UTC date (`target`: `'start' \| 'end' \| 'point'`) |
| `moveByStep(direction, target?)` | Move by the configured `behavior.step`                               |
| `setTimeUnit(timeUnit)`          | Change the active granularity (resets scroll, re-centres the handle) |
| `focusHandle(handleType)`        | Programmatically focus a handle                                      |

### Render props (`RenderPropsConfig`)

Override any sub-component's markup while keeping the slider's behaviour. Each renderer receives the state and handlers it needs:

| Renderer                  | Key props                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderDateLabel`         | `label`                                                                                                                                              |
| `renderSelectionPanel`    | `dateLabel`, `toNextDate`, `toPrevDate`                                                                                                              |
| `renderTimeUnitSelection` | `timeUnit`, `availableTimeUnits`, `selectTimeUnit`, `isMonthValid`, `isYearValid`, `handleTimeUnit{Next,Previous}Select`, `is{Next,Prev}BtnDisabled` |

`renderTimeUnitSelection` exposes two tiers: the ready-made `handleTimeUnitNextSelect`/`handleTimeUnitPreviousSelect` + `is{Next,Prev}BtnDisabled` for a simple stepper, **or** the lower-level `availableTimeUnits` + `selectTimeUnit(unit)` + `isMonthValid`/`isYearValid` to build a custom control (dropdown, segmented buttons) with your own selection logic.

### External state store (`useDateSliderStore` / `useDateSliderState`)

Render props place the SelectionPanel/TimeUnitSelection **inside** the slider's
flex layout. When the host needs them as **siblings** instead — e.g. to keep the
date panel pinned while the slider collapses — use the state store: the slider
stays the source of truth and just publishes its live state outward.

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

<DateSlider
  imperativeRef={sliderRef}
  stateStore={store}
  layout={{ selectionPanelEnabled: false, timeUnitSelectionEnabled: false }}
  /* … */
/>;
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
  `SliderHandle`, `DateLabel`, `ScalesUnitLabels`, `SelectionPanel`,
  `TimeUnitSelection`, and the default renderers.
- `hooks/` — drag, position, scroll, scaling, dimensions, focus, debouncing.
- `utils/` — pure helpers (`cn`, `clamp`, `debounce`, …) plus
  `dateSliderUtils.ts` for slider-specific date math.
- `constants.ts` — layout / timing / accessibility magic-number registry,
  including `BREAKPOINT` for `useViewportSize`.
- `type.ts` — public types.
