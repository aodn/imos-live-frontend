import { useMemo } from 'react';
import { LineChartProps } from './typs';
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
    exporting = { enabled: true },
    boost = false,
    turboThreshold = 1000,
    onPointClick,
    onSeriesClick,
    onChartLoad,
    onRedraw,
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
    exporting,
    boost,
    turboThreshold,
    onPointClick,
    onSeriesClick,
    onChartLoad,
    onRedraw,
    accessibility,
    themedColors,
  ]);
};
