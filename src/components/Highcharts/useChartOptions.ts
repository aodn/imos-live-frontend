import { useMemo } from 'react';
import { LineChartProps } from './type';
import {
  DEFAULT_THEME,
  buildChartConfig,
  buildTitleConfig,
  buildAxisConfig,
  processSeries,
  buildTooltipConfig,
  buildLegendConfig,
  buildPlotOptionsConfig,
  buildExportingConfig,
  buildRangeSelectorConfig,
  buildNavigatorConfig,
  buildScrollbarConfig,
} from './utils';

export const useChartOptions = (props: LineChartProps) => {
  const {
    title = 'Line Chart',
    subtitle,
    series,
    width = '100%',
    height = 400,
    responsive = true,
    xAxis,
    yAxis,
    theme,
    animation = { enabled: true, duration: 1000 },
    tooltip,
    legend = { enabled: true },
    plotOptions,
    zoomType,
    panKey = 'shift',
    panning = false,
    rangeSelector, // Add this
    navigator, // Add this
    scrollbar, // Add this
    exporting = { enabled: true },
    boost = false,
    turboThreshold = 1000,
    onPointClick,
    onSeriesClick,
    onChartLoad,
    onRedraw,
    onRangeSelect, // Add this
    onRangeButtonClick, // Add this
    accessibility,
  } = props;

  const themedColors = useMemo(() => theme?.colors || DEFAULT_THEME.colors, [theme?.colors]);

  return useMemo(() => {
    const chartOptions: Highcharts.Options = {
      chart: buildChartConfig(
        width,
        height,
        zoomType,
        panKey,
        panning,
        animation,
        theme,
        rangeSelector, // Pass rangeSelector to adjust margins
        onChartLoad,
        onRedraw,
      ),

      ...buildTitleConfig(title, subtitle, theme),

      colors: themedColors,
      xAxis: buildAxisConfig(xAxis, theme),
      yAxis: buildAxisConfig(yAxis, theme),

      series: processSeries(series, themedColors, onPointClick, onSeriesClick),

      tooltip: buildTooltipConfig(tooltip, theme),
      legend: buildLegendConfig(legend, theme),
      plotOptions: buildPlotOptionsConfig(animation, turboThreshold, boost, plotOptions),

      // ADD THESE CONFIGURATIONS
      rangeSelector: buildRangeSelectorConfig(rangeSelector, theme),
      navigator: buildNavigatorConfig(navigator, theme),
      scrollbar: buildScrollbarConfig(scrollbar, theme),

      boost: boost
        ? {
            enabled: true,
            useGPUTranslations: true,
            seriesThreshold: 1,
          }
        : undefined,

      exporting: buildExportingConfig(exporting),

      accessibility: {
        enabled: true,
        ...accessibility,
      },

      responsive: responsive
        ? {
            rules: [
              {
                condition: { maxWidth: 500 },
                chartOptions: {
                  legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                  },
                },
              },
            ],
          }
        : undefined,

      credits: { enabled: false },
    };

    // Add range selector event handlers
    if (rangeSelector?.enabled && (onRangeSelect || onRangeButtonClick)) {
      if (!chartOptions.xAxis) chartOptions.xAxis = {};

      const xAxisConfig = Array.isArray(chartOptions.xAxis)
        ? chartOptions.xAxis[0]
        : chartOptions.xAxis;

      if (!xAxisConfig.events) xAxisConfig.events = {};

      if (onRangeSelect) {
        xAxisConfig.events.afterSetExtremes = function (this: any, event: any) {
          if (event.min !== undefined && event.max !== undefined) {
            onRangeSelect(event.min, event.max);
          }
        };
      }
    }

    return chartOptions;
  }, [
    title,
    subtitle,
    series,
    width,
    height,
    responsive,
    xAxis,
    yAxis,
    theme,
    animation,
    tooltip,
    legend,
    plotOptions,
    zoomType,
    panKey,
    panning,
    rangeSelector, // Add these to dependencies
    navigator,
    scrollbar,
    exporting,
    boost,
    turboThreshold,
    onPointClick,
    onSeriesClick,
    onChartLoad,
    onRedraw,
    onRangeSelect,
    onRangeButtonClick,
    accessibility,
    themedColors,
  ]);
};
