import HighchartsReact from 'highcharts-react-official';
import { useCallback } from 'react';
import { DataPoint, SeriesData, ThemeConfig, AnimationConfig } from './type';
import { DEFAULT_THEME, processSeries, exportFallbacks } from './utils';

export const useChartMethods = (
  chartRef: React.RefObject<HighchartsReact.RefObject | null>,
  onPointClick?: (point: any) => void,
  onSeriesClick?: (series: any) => void,
) => {
  // Existing methods...
  const updateData = useCallback(
    (seriesIndex: number, newData: number[] | DataPoint[]) => {
      const chart = chartRef.current?.chart;
      if (chart?.series[seriesIndex]) {
        // Convert DataPoint.x from Date to number if necessary
        const safeData =
          Array.isArray(newData) && newData.length > 0 && typeof newData[0] === 'object'
            ? (newData as DataPoint[]).map(point =>
                point && typeof point === 'object' && 'x' in point && point.x instanceof Date
                  ? { ...point, x: point.x.getTime() }
                  : point,
              )
            : newData;
        chart.series[seriesIndex].setData(safeData as Highcharts.PointOptionsType[], true);
      }
    },
    [chartRef],
  );

  const updateTitle = useCallback(
    (newTitle: string) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        chart.setTitle({ text: newTitle });
      }
    },
    [chartRef],
  );

  const updateSubtitle = useCallback(
    (newSubtitle: string) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        chart.setTitle(undefined, { text: newSubtitle });
      }
    },
    [chartRef],
  );

  const updateSeries = useCallback(
    (newSeries: SeriesData[]) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        // Remove existing series
        while (chart.series.length > 0) {
          chart.series[0].remove(false);
        }

        // Add new series
        const themedColors = DEFAULT_THEME.colors;
        const processedSeries = processSeries(newSeries, themedColors, onPointClick, onSeriesClick);
        processedSeries.forEach(series => chart.addSeries(series, false));

        chart.redraw();
      }
    },
    [chartRef, onPointClick, onSeriesClick],
  );

  const updateTheme = useCallback(
    (newTheme: ThemeConfig) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        chart.update({
          chart: {
            backgroundColor: newTheme.backgroundColor || DEFAULT_THEME.backgroundColor,
          },
          colors: newTheme.colors || DEFAULT_THEME.colors,
        });
      }
    },
    [chartRef],
  );

  const updateAnimation = useCallback(
    (animationConfig: AnimationConfig) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        chart.update({
          chart: {
            animation: animationConfig.enabled
              ? {
                  duration: animationConfig.duration || 1000,
                  easing: animationConfig.easing as any,
                }
              : false,
          },
          plotOptions: {
            series: {
              animation: animationConfig.enabled
                ? {
                    duration: animationConfig.duration || 1000,
                  }
                : false,
            },
          },
        });
      }
    },
    [chartRef],
  );

  const addSeries = useCallback(
    (seriesData: SeriesData) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        const themedColors = DEFAULT_THEME.colors;
        const processedSeries = processSeries(
          [seriesData],
          themedColors,
          onPointClick,
          onSeriesClick,
        );
        chart.addSeries(processedSeries[0]);
      }
    },
    [chartRef, onPointClick, onSeriesClick],
  );

  const removeSeries = useCallback(
    (seriesIndex: number) => {
      const chart = chartRef.current?.chart;
      if (chart?.series[seriesIndex]) {
        chart.series[seriesIndex].remove();
      }
    },
    [chartRef],
  );

  const showSeries = useCallback(
    (seriesIndex: number) => {
      const chart = chartRef.current?.chart;
      if (chart?.series[seriesIndex]) {
        chart.series[seriesIndex].show();
      }
    },
    [chartRef],
  );

  const hideSeries = useCallback(
    (seriesIndex: number) => {
      const chart = chartRef.current?.chart;
      if (chart?.series[seriesIndex]) {
        chart.series[seriesIndex].hide();
      }
    },
    [chartRef],
  );

  const exportChart = useCallback(
    (format: 'png' | 'jpeg' | 'pdf' | 'svg', filename = 'chart') => {
      const chart = chartRef.current?.chart;
      if (!chart) return;

      if (format === 'svg' || format === 'png' || format === 'jpeg' || format === 'pdf') {
        exportFallbacks[format](chart, filename);
      }
    },
    [chartRef],
  );

  const updateSize = useCallback(
    (newWidth?: number, newHeight?: number) => {
      const chart = chartRef.current?.chart;
      if (chart) {
        chart.setSize(newWidth, newHeight);
      }
    },
    [chartRef],
  );

  // NEW: Range selector methods
  const setDateRange = useCallback(
    (min: number | Date, max: number | Date) => {
      const chart = chartRef.current?.chart;
      if (chart && chart.xAxis && chart.xAxis[0]) {
        const minTime = min instanceof Date ? min.getTime() : min;
        const maxTime = max instanceof Date ? max.getTime() : max;
        chart.xAxis[0].setExtremes(minTime, maxTime);
      }
    },
    [chartRef],
  );

  const selectRangeButton = useCallback(
    (buttonIndex: number) => {
      const chart = chartRef.current?.chart;
      if (chart && (chart as any).rangeSelector) {
        (chart as any).rangeSelector.clickButton(buttonIndex);
      }
    },
    [chartRef],
  );

  const zoomToRange = useCallback(
    (min: number | Date, max: number | Date) => {
      const chart = chartRef.current?.chart;
      if (chart && chart.xAxis && chart.xAxis[0]) {
        const minTime = min instanceof Date ? min.getTime() : min;
        const maxTime = max instanceof Date ? max.getTime() : max;
        chart.xAxis[0].setExtremes(minTime, maxTime);
        chart.redraw();
      }
    },
    [chartRef],
  );

  const resetZoom = useCallback(() => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.zoomOut();
    }
  }, [chartRef]);

  const getChartInstance = useCallback(() => chartRef.current?.chart || null, [chartRef]);

  const redraw = useCallback(() => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.redraw();
    }
  }, [chartRef]);

  const destroy = useCallback(() => {
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.destroy();
    }
  }, [chartRef]);

  return {
    // Existing methods
    updateData,
    updateTitle,
    updateSubtitle,
    updateSeries,
    updateTheme,
    updateAnimation,
    addSeries,
    removeSeries,
    showSeries,
    hideSeries,
    exportChart,
    updateSize,
    getChartInstance,
    redraw,
    destroy,

    // NEW: Range selector methods
    setDateRange,
    selectRangeButton,
    zoomToRange,
    resetZoom,
  };
};
