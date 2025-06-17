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
  data: number[] | DataPoint[];
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

  // Chart utilities
  exportChart: (format: 'png' | 'jpeg' | 'pdf' | 'svg', filename?: string) => void;
  updateSize: (width?: number, height?: number) => void;
  getChartInstance: () => Highcharts.Chart | null;
  getChartOptions: () => Highcharts.Options;
  redraw: () => void;
  destroy: () => void;
}

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

  // Interaction
  zoomType?: 'x' | 'y' | 'xy';
  panKey?: 'alt' | 'ctrl' | 'meta' | 'shift';
  panning?: boolean;

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

  // Accessibility
  accessibility?: Highcharts.AccessibilityOptions;

  // Ref for exposed methods
  ref?: RefObject<LineChartExposedMethods>;
}
