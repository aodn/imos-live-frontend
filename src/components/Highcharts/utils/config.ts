import type Highcharts from 'highcharts/highstock';
import type {
  AnimationConfig,
  NavigatorConfig,
  RangeSelectorConfig,
  ScrollbarConfig,
  ThemeConfig,
  TooltipConfig,
  TooltipFormatterContext,
} from '../type';
import { DEFAULT_THEME } from './theme';

// ─── Range selector ─────────────────────────────────────────────────────────

export function buildRangeSelectorConfig(rangeSelector?: RangeSelectorConfig, theme?: ThemeConfig) {
  if (!rangeSelector?.enabled) {
    return { enabled: false };
  }

  const defaultButtons = [
    { type: 'day' as const, count: 7, text: '7d' },
    { type: 'day' as const, count: 30, text: '30d' },
    { type: 'month' as const, count: 3, text: '3m' },
    { type: 'month' as const, count: 6, text: '6m' },
    { type: 'year' as const, count: 1, text: '1y' },
    { type: 'all' as const, text: 'All' },
  ];

  return {
    enabled: true,
    selected: rangeSelector.selected || 1,
    buttons: rangeSelector.buttons || defaultButtons,
    inputEnabled: rangeSelector.inputEnabled !== false,

    inputBoxBorderColor:
      rangeSelector.inputBoxBorderColor || theme?.lineColor || DEFAULT_THEME.lineColor,
    inputBoxWidth: rangeSelector.inputBoxWidth || 120,
    inputBoxHeight: rangeSelector.inputBoxHeight || 20,
    inputStyle: rangeSelector.inputStyle || {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      background: 'white',
      border: '1px solid #cccccc',
      zIndex: 10,
      opacity: 1,
    },
    inputDateFormat: rangeSelector.inputDateFormat || '%Y-%m-%d',
    inputEditDateFormat: rangeSelector.inputEditDateFormat || '%Y-%m-%d',
    floating: rangeSelector.floating || false,
    y: rangeSelector.y || 0,
    height: rangeSelector.height || 35,
    labelStyle: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontWeight: 'bold',
    },

    buttonTheme: {
      fill: theme?.backgroundColor || 'none',
      stroke: theme?.lineColor || DEFAULT_THEME.lineColor,
      'stroke-width': 1,
      zIndex: 7,
      style: {
        color: theme?.textColor || DEFAULT_THEME.textColor,
        fontWeight: 'normal',
      },
      states: {
        hover: {
          fill: theme?.gridColor || '#f0f0f0',
          style: {
            color: theme?.textColor || DEFAULT_THEME.textColor,
          },
        },
        select: {
          fill: theme?.lineColor || DEFAULT_THEME.lineColor,
          style: {
            color: '#ffffff',
          },
        },
      },
    },
  };
}

// ─── Navigator ──────────────────────────────────────────────────────────────

export function buildNavigatorConfig(navigator?: NavigatorConfig, theme?: ThemeConfig) {
  if (!navigator?.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    height: navigator.height || 40,
    margin: navigator.margin || 25,
    maskFill: navigator.maskFill || 'rgba(102, 133, 194, 0.3)',
    outlineColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    outlineWidth: 1,
    handles: {
      backgroundColor: theme?.backgroundColor || '#f2f2f2',
      borderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    },
    xAxis: {
      gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
      labels: {
        style: {
          color: theme?.textColor || '#666666',
          fontSize: '10px',
        },
      },
    },
    yAxis: {
      gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    },
    series: {
      color: theme?.colors?.[0] || DEFAULT_THEME.colors[0],
      fillOpacity: 0.05,
      lineWidth: 1,
    },
  };
}

// ─── Scrollbar ──────────────────────────────────────────────────────────────

export function buildScrollbarConfig(scrollbar?: ScrollbarConfig, theme?: ThemeConfig) {
  if (!scrollbar?.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    height: scrollbar.height || 20,
    barBackgroundColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    barBorderRadius: 7,
    barBorderWidth: 0,
    buttonBackgroundColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    buttonBorderWidth: 0,
    buttonBorderRadius: 7,
    trackBackgroundColor: 'none',
    trackBorderWidth: 1,
    trackBorderRadius: 8,
    trackBorderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
  };
}

// ─── Chart + title ──────────────────────────────────────────────────────────

export function buildChartConfig(
  width: string | number,
  height: string | number,
  zoomType: string | undefined,
  panKey: string,
  panning: boolean,
  animation: AnimationConfig,
  theme: ThemeConfig | undefined,
  rangeSelector?: RangeSelectorConfig,
  onChartLoad?: (chart: Highcharts.Chart) => void,
  onRedraw?: () => void,
): Highcharts.ChartOptions {
  return {
    type: 'line',
    backgroundColor: theme?.backgroundColor || DEFAULT_THEME.backgroundColor,
    width: typeof width === 'number' ? width : undefined,
    height: typeof height === 'number' ? height : undefined,
    // Highcharts narrows panKey to a specific union at the type level; the
    // caller may pass any string, so coerce at the boundary.
    panKey: panKey as Highcharts.ChartOptions['panKey'],
    panning: panning ? { enabled: true } : undefined,
    animation: animation.enabled
      ? {
          duration: animation.duration,
          easing: animation.easing as Highcharts.AnimationOptionsObject['easing'],
        }
      : false,
    events: {
      load: function (this: Highcharts.Chart) {
        onChartLoad?.(this);
      },
      redraw: onRedraw,
    },
    // Margin to accommodate the range-selector input row.
    marginTop: rangeSelector?.enabled ? 100 : undefined,
    marginBottom: 120,
    spacing: [10, 10, 15, 10],
    // `zoomType` was renamed to `zooming.type` in Highcharts 11+. Spread the
    // legacy field as `unknown` so old call sites keep working until we cut
    // over to the new option.
    ...(zoomType ? ({ zoomType } as unknown as Pick<Highcharts.ChartOptions, never>) : {}),
  };
}

export function buildTitleConfig(
  title: string,
  subtitle: string | undefined,
  theme: ThemeConfig | undefined,
) {
  return {
    title: {
      text: title,
      useHTML: true,
      style: {
        color: theme?.textColor || DEFAULT_THEME.textColor,
      },
    },
    subtitle: subtitle
      ? {
          text: subtitle,
          style: {
            color: theme?.textColor || '#666666',
          },
        }
      : undefined,
  };
}

// ─── Axis ──────────────────────────────────────────────────────────────────

type AxisInput =
  | Highcharts.XAxisOptions
  | Highcharts.YAxisOptions
  | (Highcharts.XAxisOptions | Highcharts.YAxisOptions)[];

export function buildAxisConfig(axis: AxisInput | undefined, theme: ThemeConfig | undefined) {
  const defaultAxis = {
    gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    lineColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    tickColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    labels: {
      style: {
        color: theme?.textColor || '#666666',
      },
    },
    title: {
      style: {
        color: theme?.textColor || DEFAULT_THEME.textColor,
      },
    },
  };

  if (Array.isArray(axis)) {
    return axis.map(a => ({ ...defaultAxis, ...a }));
  }

  return axis ? [{ ...defaultAxis, ...axis }] : [defaultAxis];
}

// ─── Tooltip ───────────────────────────────────────────────────────────────

export function buildTooltipConfig(
  tooltip: TooltipConfig | undefined,
  theme: ThemeConfig | undefined,
): Highcharts.TooltipOptions {
  const { customFormatter, ...otherTooltipProps } = tooltip ?? {};

  return {
    shared: true,
    useHTML: true,
    backgroundColor: theme?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
    borderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    style: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
    },
    // Highcharts 12 dropped the public `TooltipFormatterContextObject` type,
    // so the `this` shape no longer matches `TooltipFormatterCallbackFunction`
    // structurally even though it still carries `.point` at runtime. Cast on
    // assignment rather than weakening the inner function's `this`.
    formatter: customFormatter
      ? (function (this: TooltipFormatterContext) {
          return customFormatter(this);
        } as unknown as Highcharts.TooltipFormatterCallbackFunction)
      : undefined,
    ...otherTooltipProps,
  };
}

// ─── Legend ────────────────────────────────────────────────────────────────

export function buildLegendConfig(
  legend: Highcharts.LegendOptions | undefined,
  theme: ThemeConfig | undefined,
): Highcharts.LegendOptions {
  return {
    itemStyle: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
    },
    itemHoverStyle: {
      color: theme?.textColor || '#000000',
    },
    ...legend,
  };
}

// ─── Plot options ──────────────────────────────────────────────────────────

export function buildPlotOptionsConfig(
  animation: AnimationConfig,
  turboThreshold: number,
  boost: boolean,
  plotOptions: Highcharts.PlotOptions | undefined,
): Highcharts.PlotOptions {
  // `boost` on the per-series options is legacy — Highcharts 12's `PlotOptions`
  // type only exposes the chart-level `boost`. We preserve the existing
  // behaviour (passing it through on the series) via a single localised cast
  // rather than spreading `any` through the whole builder signature.
  const seriesOptions: Highcharts.PlotSeriesOptions = {
    animation: animation.enabled ? { duration: animation.duration } : false,
    turboThreshold,
    marker: {
      enabled: true,
      symbol: 'circle',
      radius: 4,
    },
    ...plotOptions?.series,
    ...(boost
      ? ({ boost: { enabled: true, useGPUTranslations: true } } as Pick<
          Highcharts.PlotSeriesOptions,
          never
        >)
      : {}),
  };

  return {
    series: seriesOptions,
    ...plotOptions,
  };
}
