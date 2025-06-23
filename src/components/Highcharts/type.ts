import { RefObject } from 'react';

export interface DataPoint {
  x?: number | string | Date;
  y: number;
  name?: string;
  color?: string;
  marker?: Highcharts.PointMarkerOptionsObject;
  dataLabels?: Highcharts.DataLabelsOptions;
  [key: string]: any;
}

export interface SeriesData {
  name: string;
  data: (number | string)[][] | DataPoint[];
  color?: string;
  type?: 'line' | 'spline' | 'area' | 'areaspline' | 'column' | 'scatter';
  lineWidth?: number;
  dashStyle?: Highcharts.DashStyleValue;
  marker?: Highcharts.PointMarkerOptionsObject;
  visible?: boolean;
  showInLegend?: boolean;
  yAxis?: number;
  zIndex?: number;
}

export interface ThemeConfig {
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  lineColor?: string;
  colors?: string[];
}

export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: string;
}

export interface TooltipConfig extends Highcharts.TooltipOptions {
  customFormatter?: (point: Highcharts.Point) => string;
}

export interface ExportConfig {
  enabled?: boolean;
  filename?: string;
  formats?: ('png' | 'jpeg' | 'pdf' | 'svg')[];
  buttons?: Highcharts.ExportingButtonsOptions;
}

// NEW: Range Selector Type Interfaces
export interface RangeSelectorButton {
  type: 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  count?: number;
  text: string;
  title?: string;
}

export interface RangeSelectorConfig {
  enabled?: boolean;
  selected?: number; // Which button is selected by default (0-based index)
  buttons?: RangeSelectorButton[];
  inputEnabled?: boolean; // Show date input fields
  inputBoxWidth?: number;
  inputBoxHeight?: number;
  inputPosition?: {
    align?: 'left' | 'center' | 'right';
    x?: number;
    y?: number;
  };
  buttonPosition?: {
    align?: 'left' | 'center' | 'right';
    x?: number;
    y?: number;
  };
  inputBoxBorderColor?: string;
  inputStyle?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    background?: string;
    border?: string;
    zIndex?: number;
    opacity?: number;
    textAlign?: string;
    lineHeight?: string;
    padding?: string;
    margin?: string;
    boxSizing?: string;
  };
  inputDateFormat?: string;
  inputEditDateFormat?: string;
  y?: number; // Positioning from top
  height?: number; // Height of range selector
  floating?: boolean; // Whether it floats over chart
}

export interface NavigatorConfig {
  enabled?: boolean;
  height?: number; // Height of the navigator chart
  margin?: number; // Margin below the main chart
  maskFill?: string; // Color of the mask outside selected range
  outlineColor?: string;
  outlineWidth?: number;
  handles?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  series?: {
    type?: string;
    color?: string;
    fillOpacity?: number;
    lineWidth?: number;
  };
}

export interface ScrollbarConfig {
  enabled?: boolean;
  height?: number;
  margin?: number;
  liveRedraw?: boolean; // Whether to redraw chart while dragging
  minWidth?: number; // Minimum width of the scrollbar handle
}

// UPDATED: LineChartExposedMethods (add range selector methods)
export interface LineChartExposedMethods {
  // State-based updates (Highcharts recommended approach)
  updateData: (seriesIndex: number, newData: number[] | DataPoint[]) => void;
  updateTitle: (newTitle: string) => void;
  updateSubtitle: (newSubtitle: string) => void;
  updateSeries: (newSeries: SeriesData[]) => void;
  updateTheme: (newTheme: ThemeConfig) => void;
  updateAnimation: (animationConfig: AnimationConfig) => void;

  // Dynamic series manipulation
  addSeries: (seriesData: SeriesData) => void;
  removeSeries: (seriesIndex: number) => void;
  showSeries: (seriesIndex: number) => void;
  hideSeries: (seriesIndex: number) => void;

  // NEW: Range selector methods
  setDateRange: (min: number | Date, max: number | Date) => void;
  selectRangeButton: (buttonIndex: number) => void;
  zoomToRange: (min: number | Date, max: number | Date) => void;
  resetZoom: () => void;

  // Chart utilities
  exportChart: (format: 'png' | 'jpeg' | 'pdf' | 'svg', filename?: string) => void;
  updateSize: (width?: number, height?: number) => void;
  getChartInstance: () => Highcharts.Chart | null;
  getChartOptions: () => Highcharts.Options;
  redraw: () => void;
  destroy: () => void;
}

// UPDATED: LineChartProps (add range selector props)
export interface LineChartProps {
  // Basic configuration
  title?: string;
  subtitle?: string;
  series: SeriesData[];

  // Dimensions
  width?: number | string;
  height?: number | string;
  responsive?: boolean;

  // Axes configuration
  xAxis?: Highcharts.XAxisOptions | Highcharts.XAxisOptions[];
  yAxis?: Highcharts.YAxisOptions | Highcharts.YAxisOptions[];

  // Styling and theming
  theme?: ThemeConfig;
  className?: string;
  style?: React.CSSProperties;

  // Chart behavior
  animation?: AnimationConfig;
  tooltip?: TooltipConfig;
  legend?: Highcharts.LegendOptions;
  plotOptions?: Highcharts.PlotOptions;
  chart?: Partial<Highcharts.ChartOptions>;

  // Interaction
  zoomType?: 'x' | 'y' | 'xy';
  panKey?: 'alt' | 'ctrl' | 'meta' | 'shift';
  panning?: boolean;

  // NEW: Range selector and navigator
  rangeSelector?: RangeSelectorConfig;
  navigator?: NavigatorConfig;
  scrollbar?: ScrollbarConfig;

  // Export functionality
  exporting?: ExportConfig;

  // Performance
  boost?: boolean;
  turboThreshold?: number;

  // Events
  onPointClick?: (point: Highcharts.Point) => void;
  onSeriesClick?: (series: Highcharts.Series) => void;
  onChartLoad?: (chart: Highcharts.Chart) => void;
  onRedraw?: () => void;

  // NEW: Range selector events
  onRangeSelect?: (min: number, max: number) => void;
  onRangeButtonClick?: (buttonIndex: number, buttonConfig: RangeSelectorButton) => void;

  // Accessibility
  accessibility?: Highcharts.AccessibilityOptions;

  // Ref for exposed methods
  ref?: RefObject<LineChartExposedMethods>;
}
