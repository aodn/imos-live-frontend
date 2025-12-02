import type { ReactNode, RefObject } from 'react';

import type { DateGranularity } from './utils';

/**
 * Selection mode for the DateSlider component
 * - `'point'`: Single date selection
 * - `'range'`: Date range selection with start and end dates
 * - `'combined'`: Both point and range selection simultaneously
 */
export type ViewMode = 'range' | 'point' | 'combined';

/**
 * Time unit granularity for date navigation and display
 * - `'day'`: Daily granularity
 * - `'month'`: Monthly granularity
 * - `'year'`: Yearly granularity
 */
export type TimeUnit = 'day' | 'month' | 'year';

/**
 * Handle type identifier for drag operations
 * - `'start'`: Range start handle
 * - `'end'`: Range end handle
 * - `'point'`: Point handle
 * - `null`: No handle
 */
export type DragHandle = 'start' | 'end' | 'point' | null;

// Re-export for convenience
export type { DateGranularity };

/**
 * Time label for scale marks on the slider track
 * @property {Date} date - The date/time value for this label
 * @property {number} position - Horizontal position in pixels from track start
 */
export type TimeLabel = {
  date: Date;
  position: number;
};

/**
 * Selection result type - now unified with SliderValue
 */
export type SelectionResult = SliderValue;

/**
 * Configuration for scale unit sizing and spacing
 * Controls the visual appearance of tick marks on the slider track
 *
 * @example
 * ```tsx
 * <DateSlider
 *   layout={{
 *     scaleUnitConfig: {
 *       gap: 60,
 *       width: { short: 1, medium: 1, long: 1 },
 *       height: { short: 10, medium: 20, long: 40 }
 *     }
 *   }}
 * />
 * ```
 */
export type ScaleUnitConfig = {
  /** Gap between scale units in pixels */
  gap?: number;
  /** Width of scale marks in pixels for each size variant */
  width: {
    /** Width for short (minor) tick marks */
    short: number;
    /** Width for medium tick marks */
    medium: number;
    /** Width for long (major) tick marks */
    long: number;
  };
  /** Height of scale marks in pixels for each size variant */
  height: {
    /** Height for short (minor) tick marks */
    short: number;
    /** Height for medium tick marks */
    medium: number;
    /** Height for long (major) tick marks */
    long: number;
  };
};

/**
 * Imperative API for programmatically controlling the DateSlider
 *
 * @example
 * ```tsx
 * const sliderRef = useRef<SliderExposedMethod>(null);
 *
 * // Set a specific date
 * sliderRef.current?.setDateTime(new Date('2024-06-15'), 'point');
 *
 * // Focus a handle
 * sliderRef.current?.focusHandle('point');
 * ```
 */
export type SliderExposedMethod = {
  /**
   * Programmatically set the date/time for a specific handle
   * @param date - UTC Date to set
   * @param target - Which handle to update ('start', 'end', 'point'). Defaults to the current active handle.
   */
  setDateTime: (date: Date, target?: DragHandle) => void;

  /**
   * Programmatically focus a specific handle
   * @param handleType - Which handle to focus ('start', 'end', 'point')
   */
  focusHandle: (handleType: DragHandle) => void;
};

/**
 * Comprehensive className customization for all DateSlider elements.
 * All properties are optional and support full Tailwind CSS utilities.
 */
export type DateSliderClassNames = {
  // Container
  /** Main wrapper element containing the entire slider */
  wrapper?: string;
  /** Slider container element */
  slider?: string;

  // Track
  /** Base track element */
  track?: string;
  /** Active portion of the track (point/range indicator) */
  trackActive?: string;
  /** Inactive/background portion of the track */
  trackInactive?: string;

  // Handles
  /** Base styles for all handles */
  handle?: string;
  /** Point handle specific styles */
  handlePoint?: string;
  /** Range start handle specific styles */
  handleStart?: string;
  /** Range end handle specific styles */
  handleEnd?: string;
  /** Applied when a handle is being dragged */
  handleDragging?: string;
  /** Icon wrapper inside handle */
  handleIcon?: string;

  /** Scale tick mark labels */
  scaleLabel?: string;

  // Visual Indicators
  /** Vertical cursor line on hover */
  cursorLine?: string;
  /** Base styles for all scale marks */
  scaleMark?: string;
  /** Major scale tick marks */
  scaleMarkMajor?: string;
  /** Minor scale tick marks */
  scaleMarkMinor?: string;
  /** Medium scale tick marks */
  scaleMarkMedium?: string;
};

/**
 * Icon configuration for slider handles
 */
export type IconsConfig = {
  /** Icon for point handle */
  point?: ReactNode;
  /** Icon for range start handle */
  rangeStart?: ReactNode;
  /** Icon for range end handle */
  rangeEnd?: ReactNode;
};

/**
 * Behavior configuration for slider interactions
 */
export type BehaviorConfig = {
  /** Enable horizontal scrolling when slider exceeds viewport width */
  scrollable?: boolean;
  /** Allow free datetime selection on track click (not limited to scale units) */
  freeSelectionOnTrackClick?: boolean;
  /** Keep handle date label visible persistently */
  handleLabelPersistent?: boolean;
  /** always disable hadle label */
  handleLabelDisabled?: boolean;
};

/**
 * Layout and sizing configuration
 */
export type LayoutConfig = {
  /** Slider width - 'fill' to fill parent, or specific number in pixels */
  width: 'fill' | number;
  /** Slider height in pixels */
  height?: number;
  /** Horizontal padding for track in pixels */
  trackPaddingX?: number;
  /** Show end label on scale */
  showEndLabel?: boolean;
  /** Minimum gap between scale units in pixels */
  minGapScaleUnits?: number;
  /** Custom scale unit sizing configuration */
  scaleUnitConfig?: ScaleUnitConfig;
};

/**
 * Point mode value
 */
export type PointValue = {
  point: Date;
};

/**
 * Range mode value
 */
export type RangeValue = {
  start: Date;
  end: Date;
};

/**
 * Combined mode value (both point and range)
 */
export type CombinedValue = {
  point: Date;
  start: Date;
  end: Date;
};

/**
 * Union type for all slider value types
 */
export type SliderValue = PointValue | RangeValue | CombinedValue;

/**
 * Render prop types for custom element rendering
 */

/** Props passed to custom handle renderer */
export type HandleRenderProps = {
  /** Handle type: 'point', 'start', or 'end' */
  handleType: DragHandle;
  /** Position as percentage (0-100) */
  position: number;
  /** Formatted date label */
  label: string;
  /** Icon element for the handle */
  icon: ReactNode;
  /** Whether this handle is currently being dragged */
  isDragging: boolean;
  /** Whether any handle on the slider is being dragged */
  isSliderDragging: boolean;
  /** Mouse down event handler */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Touch start event handler */
  onTouchStart: (e: React.TouchEvent) => void;
  /** Key down event handler for keyboard navigation */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Focus event handler */
  onFocus: (e: React.FocusEvent<HTMLButtonElement>) => void;
  /** Button ref for imperative control */
  ref: RefObject<HTMLButtonElement | null>;
  /** Whether date label should persist */
  handleLabelPersistent?: boolean;
  handleLabelDisabled?: boolean;
  /** Min value for aria */
  min: number;
  /** Max value for aria */
  max: number;
  /** Current value for aria */
  value: number;
  /** ClassNames configuration */
  classNames?: DateSliderClassNames;
  /** View mode */
  viewMode?: ViewMode;
};

/**
 * Props passed to custom date label renderer
 * Used for rendering floating date labels above handles
 */
export type DateLabelRenderProps = {
  /** Formatted date string to display */
  label?: string;
};

/**
 * Props passed to custom time display renderer
 * Used for rendering the current date/time display with navigation controls
 *
 * @example
 * ```tsx
 * renderTimeDisplay={({ dateLabel, toNextDate, toPrevDate }) => (
 *   <div>
 *     <button onClick={toPrevDate}>←</button>
 *     <span>{dateLabel}</span>
 *     <button onClick={toNextDate}>→</button>
 *   </div>
 * )}
 * ```
 */
export type TimeDisplayRenderProps = {
  /** Navigate to the next date based on current time unit */
  toNextDate: () => void;
  /** Navigate to the previous date based on current time unit */
  toPrevDate: () => void;
  /** Formatted date label for current selection */
  dateLabel: string;
};

/**
 * Props passed to custom time unit selection renderer
 * Used for rendering the time unit selector (day/month/year)
 *
 * @example
 * ```tsx
 * renderTimeUnitSelection={({ timeUnit, handleTimeUnitNextSelect, handleTimeUnitPreviousSelect }) => (
 *   <div>
 *     <button onClick={handleTimeUnitPreviousSelect}>↑</button>
 *     <span>{timeUnit}</span>
 *     <button onClick={handleTimeUnitNextSelect}>↓</button>
 *   </div>
 * )}
 * ```
 */
export type TimeUnitSelectionRenderProps = {
  /** Current time unit (day/month/year) */
  timeUnit: TimeUnit;
  /** Select the next time unit (day → month → year) */
  handleTimeUnitNextSelect: () => void;
  /** Select the previous time unit (year → month → day) */
  handleTimeUnitPreviousSelect: () => void;
  /** Check if next button should be disabled */
  isNextBtnDisabled: () => boolean;
  /** Check if previous button should be disabled */
  isPrevBtnDisabled: () => boolean;
};
/**
 * Render prop function types
 */
export type RenderPropsConfig = {
  /** Custom date label renderer */
  renderDateLabel?: (props: DateLabelRenderProps) => ReactNode;
  /** Custom TimeDisplay renderer */
  renderTimeDisplay?: (props: TimeDisplayRenderProps) => ReactNode;
  /** Custom TimeUnitSelection renderer */
  renderTimeUnitSelection?: (props: TimeUnitSelectionRenderProps) => ReactNode;
};

/**
 * Common props shared across all slider modes
 */
type CommonSliderProps = {
  /** Minimum date (must be UTC) */
  min: Date;
  /** Maximum date (must be UTC) */
  max: Date;
  /** Initial time unit (day/month/year) */
  initialTimeUnit: TimeUnit;
  /** Change event handler */
  onChange: (value: SliderValue) => void;

  // ===== Grouped Configs (Optional) =====
  /**
   * Comprehensive className customization for all slider elements.
   * Use this for full control over component styling with Tailwind CSS.
   * @example
   * ```tsx
   * <DateSlider
   *   classNames={{
   *     wrapper: 'bg-white shadow-lg',
   *     trackActive: 'bg-green-500',
   *     handle: 'bg-white shadow-xl',
   *   }}
   * />
   * ```
   */
  classNames?: DateSliderClassNames;

  /**
   * Behavior configuration for slider interactions
   * @example
   * ```tsx
   * <DateSlider
   *   behavior={{
   *     scrollable: true,
   *     freeSelectionOnTrackClick: true,
   *     handleLabelPersistent: false,
   *     handleLabelDisabled?: false;

   *   }}
   * />
   * ```
   */
  behavior?: BehaviorConfig;

  /**
   * Layout and sizing configuration
   * @example
   * ```tsx
   * <DateSlider
   *   layout={{
   *     width: 'fill',
   *     height: 120,
   *     trackPaddingX: 16,
   *   }}
   * />
   * ```
   */
  layout?: LayoutConfig;

  /**
   * Custom render props for complete control over component rendering
   * @example
   * ```tsx
   * <DateSlider
   *   renderHandle={(props) => (
   *     <CustomHandle {...props} className="my-custom-handle" />
   *   )}
   *   renderLabel={(props) => (
   *     <div style={props.position}>{props.label}</div>
   *   )}
   * />
   * ```
   */
  renderProps?: RenderPropsConfig;

  // ===== Advanced Props (Optional) =====
  /** Controls display granularity (day/hour/minute) */
  granularity?: DateGranularity;
  /** Imperative API reference for external control */
  imperativeRef?: React.Ref<SliderExposedMethod>;
};

/**
 * Point mode specific props
 * Only point icon is relevant in this mode
 */
type PointModeSliderProps = {
  /** Mode identifier for point selection */
  mode: 'point';
  /** Current point value - optional, defaults to min date if not provided */
  value?: PointValue;

  /** Icon configuration - only point icon is used */
  icons?: {
    point?: ReactNode;
    rangeStart?: never;
    rangeEnd?: never;
  };
};

/**
 * Range mode specific props
 * Only range icons are relevant in this mode
 */
type RangeModeSliderProps = {
  /** Mode identifier for range selection */
  mode: 'range';
  /** Current range value - optional, defaults to min-max range if not provided */
  value?: RangeValue;

  /** Icon configuration - only range icons are used */
  icons?: {
    point?: never;
    rangeStart?: ReactNode;
    rangeEnd?: ReactNode;
  };
};

/**
 * Combined mode specific props
 * All icons can be used in this mode
 */
type CombinedModeSliderProps = {
  /** Mode identifier for combined point and range selection */
  mode: 'combined';
  /** Current combined value - optional, defaults to sensible values if not provided */
  value?: CombinedValue;

  /** Icon configuration - all icons can be used */
  icons?: {
    point?: ReactNode;
    rangeStart?: ReactNode;
    rangeEnd?: ReactNode;
  };
};

/**
 * Main props for DateSlider component with discriminated union for type safety
 * TypeScript will only allow props valid for the selected mode
 *
 * @example Point mode
 * ```tsx
 * <DateSlider
 *   mode="point"
 *   value={{ point: new Date() }}
 *   onChange={(value) => console.log(value.point)}  // TypeScript knows value has 'point'
 *   icons={{ point: <Icon /> }}  // Only point icon allowed
 * />
 * ```
 *
 * @example Range mode
 * ```tsx
 * <DateSlider
 *   mode="range"
 *   value={{ start: date1, end: date2 }}
 *   onChange={(value) => console.log(value.start, value.end)}  // TypeScript knows value has 'start' and 'end'
 *   icons={{ rangeStart: <Icon />, rangeEnd: <Icon /> }}  // Only range icons allowed
 * />
 * ```
 */
export type SliderProps = (PointModeSliderProps | RangeModeSliderProps | CombinedModeSliderProps) &
  CommonSliderProps;

export type ScaleType = 'short' | 'medium' | 'long';
export type Scale = { position: number; type: ScaleType; date: Date };
export type NumOfScales = { short: number; medium: number; long: number };

type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  onTrackTouch: (e: React.TouchEvent) => void;
  scales: Scale[];
  scaleUnitConfig: ScaleUnitConfig;
  trackRef: RefObject<HTMLDivElement | null>;
  startDate: Date;
  endDate: Date;
  onDragging: boolean;
  startHandleRef: React.RefObject<HTMLButtonElement | null>;
  endHandleRef: React.RefObject<HTMLButtonElement | null>;
  pointHandleRef: React.RefObject<HTMLButtonElement | null>;
  handleLabelPersistent?: boolean;
  handleLabelDisabled?: boolean;
  classNames?: DateSliderClassNames;
  renderDateLabel?: (props: DateLabelRenderProps) => ReactNode;
};

type PointModeProps = {
  mode: 'point';
  pointPosition: number;
};

type CombinedModeProps = {
  mode: 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
};

type RangeModeProps = {
  mode: 'range';
  rangeStart: number;
  rangeEnd: number;
};

export type SliderTrackProps = BaseSliderTrackProps &
  (PointModeProps | RangeModeProps | CombinedModeProps);

export type SliderHandleProps = {
  onDragging: boolean;
  position: number;
  label: string;
  icon: ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  ref: RefObject<HTMLButtonElement | null>;
  min?: number;
  max?: number;
  value?: number;
  handleType: DragHandle;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  viewMode?: 'point' | 'range' | 'combined';
  isSliderDragging?: boolean;
  classNames?: DateSliderClassNames;
  handleLabelPersistent?: boolean;
  handleLabelDisabled?: boolean;
  renderDateLabel?: (props: DateLabelRenderProps) => ReactNode;
};

export type RenderSliderHandleProps = {
  viewMode: 'point' | 'range' | 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  startDate: Date;
  endDate: Date;
  timeUnit: TimeUnit;
  isDragging: DragHandle | false;
  rangeHandleIcon?: React.ReactNode;
  pointHandleIcon?: React.ReactNode;
  startHandleRef: React.RefObject<HTMLButtonElement | null>;
  endHandleRef: React.RefObject<HTMLButtonElement | null>;
  pointHandleRef: React.RefObject<HTMLButtonElement | null>;
  onHandleFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onMouseDown: (handle: DragHandle) => (e: React.MouseEvent) => void;
  onTouchStart: (handle: DragHandle) => (e: React.TouchEvent) => void;
  onKeyDown: (handle: DragHandle) => (e: React.KeyboardEvent) => void;
  isSliderDragging: boolean;
  handleLabelPersistent?: boolean;
  handleLabelDisabled?: boolean;
  classNames?: DateSliderClassNames;
  renderDateLabel?: (props: DateLabelRenderProps) => ReactNode;
};

export type TimeUnitSelectionProps = {
  initialTimeUnit: TimeUnit;
  isMonthValid: boolean;
  isYearValid: boolean;
  onChange: (timeUnit: TimeUnit) => void;
  renderTimeUnitSelection: (props: TimeUnitSelectionRenderProps) => ReactNode;
};

export type TimeDisplayProps = {
  position: number;
  startDate: Date;
  endDate: Date;
  granularity: DateGranularity;
  setDateTime: (date: Date, target?: DragHandle) => void;
  renderTimeDisplay: (props: TimeDisplayRenderProps) => ReactNode;
};

export type TimeUnitLabelsProps = {
  timeLabels: TimeLabel[];
  scales: Scale[];
  trackWidth: number;
  minDistance?: number;
  withEndLabel?: boolean;
  classNames?: DateSliderClassNames;
};

export type DateLabelProps = {
  position?: { x: number; y: number };
  label?: string;
  immediateDisappear?: boolean;
  handleLabelPersistent?: boolean;
  handleLabelDisabled?: boolean;
  renderDateLabel?: (props: DateLabelRenderProps) => ReactNode;
};

export type Dimension = {
  sliderContainerWidth: number;
  trackContainerWidth: number;
};
