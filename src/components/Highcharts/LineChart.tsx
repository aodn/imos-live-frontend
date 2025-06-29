import React, { useRef, useImperativeHandle, useMemo, memo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { LineChartProps } from './type';
import { initializeHighchartsModules } from './utils';
import { useChartOptions } from './useChartOptions';
import { useChartMethods } from './useChartMethods';

initializeHighchartsModules();

Highcharts.setOptions({
  exporting: {
    fallbackToExportServer: false,
  },
});

export const LineChart = memo(({ ref, ...props }: LineChartProps) => {
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
