// The single public door for the DateSlider package — a curated allowlist, not a
// wildcard. Internal building-block components (SliderTrack, SliderHandle,
// ScalesUnitLabels) and the hooks/utils are intentionally NOT re-exported.
// See README.md § Public surface.

// ── Public component + default renderer ───────────────────────────────────────
export { DateSlider } from './components/DateSlider';
export { customDateLabelRenderer } from './components/defaultRender';

// ── Live state store (drive controls rendered outside the slider) ─────────────
export {
  createDateSliderStore,
  useDateSliderStore,
  useDateSliderState,
} from './store/dateSliderStore';

// ── Public types ──────────────────────────────────────────────────────────────
export type {
  // Main props (discriminated union on `mode`)
  SliderProps,
  ViewMode,
  TimeUnit,
  DragHandle,
  // Value shapes
  NaiveDateTime,
  SliderValue,
  PointValue,
  RangeValue,
  CombinedValue,
  SelectionResult,
  // Imperative API
  SliderExposedMethod,
  // Live state store
  DateSliderState,
  DateSliderStore,
  // Styling & config
  DateSliderClassNames,
  BehaviorConfig,
  LayoutConfig,
  RenderPropsConfig,
  IconsConfig,
  ScaleUnitConfig,
  Step,
  StepFn,
  StepFnContext,
  // Date formatting
  DateFormat,
  DateFormatFn,
  // Scale classification
  ScaleType,
  ScaleTypeResolver,
  // Render-prop contracts (for custom renderers)
  HandleRenderProps,
  DateLabelRenderProps,
} from './type';
