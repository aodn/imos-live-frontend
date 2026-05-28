import React, { useRef, useImperativeHandle, useMemo, memo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import type { LineChartProps } from './type';
import { useChartOptions } from './useChartOptions';
import { useChartMethods } from './useChartMethods';

// Highcharts 12.4.0+ auto-registers exporting/boost/accessibility/export-data/
// offline-exporting modules at import time. See `utils/exporting.ts`.

Highcharts.setOptions({
  time: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    useUTC: false,
  },
  exporting: {
    fallbackToExportServer: false,
  },
  // Override built-in menu item labels (downloadCSV/downloadXLS are rendered via lang, not menuItemDefinitions)
  lang: {
    downloadCSV: 'Download CSV',
    downloadXLS: 'Download Excel',
  },
});

export const LineChart = memo(function LineChart({ ref, ...props }: LineChartProps) {
  const { width = '100%', height = 400, className, style } = props;

  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const chartOptions = useChartOptions(props);
  const chartMethods = useChartMethods(chartRef, props.onPointClick, props.onSeriesClick);

  useImperativeHandle(
    ref,
    () => ({
      ...chartMethods,
      getChartOptions: () => chartOptions,
    }),
    [chartMethods, chartOptions],
  );

  const containerStyle = useMemo(
    (): React.CSSProperties => ({
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    }),
    [width, height, style],
  );

  return (
    <div className={className} style={containerStyle}>
      <HighchartsReact
        ref={chartRef}
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={chartOptions}
        allowChartUpdate={true}
        updateArgs={[true, true, true]}
      />
    </div>
  );
});

LineChart.displayName = 'LineChart';
