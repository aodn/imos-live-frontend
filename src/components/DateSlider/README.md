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

External callers import from the package root:

```ts
import { DateSlider } from '@/components';
// or, directly:
import { DateSlider } from '@/components/DateSlider';
```

Types are re-exported from `./index.ts`. Internal implementation files in
`./components/`, `./hooks/`, `./utils/` are not part of the public surface.

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
