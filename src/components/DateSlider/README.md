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
  min="2024-01-01"
  max="2024-12-31"
  value={{ point: date }}
  initialTimeUnit="day"
  imperativeRef={ref}
  onChange={v => setDate((v as PointValue).point)}
  layout={{ width: 'fill', height: 64, dateLabelEnabled: true }}
  behavior={{ scrollable: true }}
/>;

// Imperative control (e.g. "jump to latest available date")
ref.current?.setDateTime('2024-06-15');
```

> **All dates are naive (timezone-free) strings.** `min`, `max`, `value`, and
> everything `onChange`/the live state store returns are `NaiveDateTime` — plain
> `"YYYY-MM-DD"` or `"YYYY-MM-DDTHH:mm:ss"` strings with **no** timezone offset
> or `Z` suffix. Pass one in, get one back.

## ⚠️ Timezone model — read this before wiring up dates

The slider is timezone-free by design, and that contract is **enforced, not just
documented**: `min`/`max`/`value`/`setDateTime` are typed `NaiveDateTime`, a plain
string — not `Date` — so there's no `Date` object around to accidentally carry a
real timezone offset. The parser backing this boundary goes further and **throws**
if it sees a `Z` suffix or a `±hh:mm` offset (e.g. `"2024-06-15T09:00:00+10:00"`),
since that almost always means a real UTC instant was passed by mistake instead
of a naive wall-clock value.

Internally, the slider still stores naive values as a `Date` whose UTC-labeled
fields hold the wall-clock numbers you gave it (all position math is pure
epoch-ms arithmetic on that internal representation) — but that's purely an
implementation detail behind the naive-string boundary now. As a consumer, you
never construct or read that `Date` yourself.

Because the slider doesn't know or care what real-world timezone a naive string
is "supposed" to represent, you can use it to drive a UI in any timezone: just
consistently encode that timezone's wall-clock time as the naive string (e.g.
`"09:00:00"` for 9am Sydney time) and read `onChange`'s result the same way. In
this app's actual usage (`useDateSliderDates.ts` → `DateSelectionBar.tsx`), the
naive string is genuinely UTC, because the underlying satellite data (IMOS) is
date-only / UTC-midnight — that's a property of this app's data, not a
constraint of the slider itself.

If you're extending the package internals (a custom `scaleTypeResolver` or
`dateFormat` callback), note those still receive the internal `Date`
representation and read it with `getUTC*` — see `type.ts`'s `DateFormatFn` /
`ScaleTypeResolver` for the exact contract at that layer.

## API

### Mode (discriminated union on `mode`)

`SliderProps` is a union — `mode` selects the variant and constrains `value` and `icons`:

| `mode`       | `value` shape                                                        | Icons used        |
| ------------ | -------------------------------------------------------------------- | ----------------- |
| `'point'`    | `{ point: NaiveDateTime }`                                           | `point`           |
| `'range'`    | `{ start: NaiveDateTime; end: NaiveDateTime }`                       | `range`           |
| `'combined'` | `{ point: NaiveDateTime; start: NaiveDateTime; end: NaiveDateTime }` | `point` + `range` |

`value` is optional in every mode (defaults to `min`/`max`). `onChange` receives the matching `SliderValue`.

### Common props

| Prop                | Type                                   | Notes                                                    |
| ------------------- | -------------------------------------- | -------------------------------------------------------- |
| `min` / `max`       | `NaiveDateTime` (required)             | Bounds of the timeline — timezone-free, see below        |
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

| Method                           | Purpose                                                                     |
| -------------------------------- | --------------------------------------------------------------------------- |
| `setDateTime(date, target?)`     | Set a handle to a naive date/time (`target`: `'start' \| 'end' \| 'point'`) |
| `moveByStep(direction, target?)` | Move by the configured `behavior.step`                                      |
| `setTimeUnit(timeUnit)`          | Change the active granularity (resets scroll, re-centres the handle)        |
| `focusHandle(handleType)`        | Programmatically focus a handle                                             |

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
