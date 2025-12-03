/**
 * DateSlider Constants
 *
 * Centralized constants for the DateSlider component to avoid magic numbers
 * and improve maintainability.
 */

/**
 * Default scale configuration for the slider track
 */
export const DEFAULT_SCALE_CONFIG = {
  /** Gap between scale units in pixels */
  gap: 36,
  /** Width of scale marks in pixels */
  width: { short: 1, medium: 1, long: 1 },
  /** Height of scale marks in pixels */
  height: { short: 8, medium: 16, long: 64 },
} as const;

/**
 * Layout and spacing constants
 */
export const LAYOUT = {
  /** Default horizontal padding for the track in pixels */
  TRACK_PADDING_X: 0,
  /** Default slider height in pixels */
  DEFAULT_SLIDER_HEIGHT: 64,
  /** Minimum slider width in pixels (min-w-40 = 160px) */
  MIN_SLIDER_WIDTH: 160,
} as const;

/**
 * Label positioning constants
 */
export const LABEL = {
  /** Vertical offset for date labels above the track in pixels */
  OFFSET_Y: 24,
  /** Vertical offset for handle labels above handles in pixels */
  HANDLE_OFFSET_Y: 32,
} as const;

/**
 * Timing constants for animations and debouncing
 */
export const TIMING = {
  /** Delay before focusing a handle after interaction in milliseconds */
  FOCUS_DELAY: 50,
  /** Delay before marking drag as complete in milliseconds */
  DRAG_COMPLETE_DELAY: 50,
  /** Debounce delay for onChange callbacks in milliseconds */
  DEBOUNCE_DELAY: 100,
} as const;

/**
 * Percentage constants for slider positioning
 */
export const PERCENTAGE = {
  /** Minimum percentage value */
  MIN: 0,
  /**
   * Maximum percentage value
   * Use this for most cases including keyboard navigation and position clamping
   */
  MAX: 100,
  /**
   * Near-maximum value for edge cases where exactly 100% causes issues
   * @deprecated Use MAX instead and handle edge cases explicitly
   */
  NEAR_MAX: 99.9999,
} as const;

/**
 * Default values for slider behavior
 */
export const DEFAULTS = {
  /** Default minimum gap between range handles in scale units */
  MIN_GAP_SCALE_UNITS: 3,
  /** Default initial time unit */
  INITIAL_TIME_UNIT: 'day' as const,
} as const;

/**
 * Accessibility constants
 */
export const ACCESSIBILITY = {
  /** Default ARIA label for the slider group */
  SLIDER_ARIA_LABEL: 'Date and Time Slider',
  /** Default ARIA label for the track */
  TRACK_ARIA_LABEL: 'Date slider track',
} as const;
