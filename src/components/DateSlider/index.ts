// The single public door for the DateSlider package — a curated allowlist, not a
// wildcard. Internal building-block components (SliderTrack, SliderHandle,
// SelectionPanel, ScalesUnitLabels, TimeUnitSelection) and the hooks/utils are
// intentionally NOT re-exported. See README.md § Public surface.

// ── Public component + default renderers ──────────────────────────────────────
export { DateSlider } from './components/DateSlider';
export {
  customDateLabelRenderer,
  customSelectionPanelRenderer,
  customTimeUnitSelectionRenderer,
} from './components/defaultRender';

// ── Public types ──────────────────────────────────────────────────────────────
export type {
  // Main props (discriminated union on `mode`)
  SliderProps,
  ViewMode,
  TimeUnit,
  DragHandle,
  // Value shapes
  SliderValue,
  PointValue,
  RangeValue,
  CombinedValue,
  SelectionResult,
  // Imperative API
  SliderExposedMethod,
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
  SelectionPanelRenderProps,
  TimeUnitSelectionRenderProps,
} from './type';
