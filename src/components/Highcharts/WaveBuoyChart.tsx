import { WaveBuoyPositionFeature } from '@/types';
import { LineChart } from './LineChart';
import { toWaveBuoyChartData } from '@/utils';
import { useWaveBuoyDetails } from '@/hooks';
import { useMemo } from 'react';
import { SeriesData } from './type';
import { buoyDataDirectionVariant, buoyDataVariants } from './config';
import { generateSeriesStyles, processDirectionData } from './utils';

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyPositionFeature, 'type'>[];
  showDirection?: boolean;
};

const WaveBuoyChart = ({ waveBuoysData, showDirection }: WaveBuoyChartProps) => {
  const { dateString, buoy, geometry } = toWaveBuoyChartData(waveBuoysData);
  const { data, loading, error } = useWaveBuoyDetails(dateString, buoy);

  const seriseData: SeriesData[] = useMemo(() => {
    if (!data) return [];
    const { features } = data;
    if (!features.length) return [];

    const properties = features[0].properties;

    const noneDirectionVariants = buoyDataVariants.filter(b => b !== buoyDataDirectionVariant);

    const seriesStyle = generateSeriesStyles(noneDirectionVariants);

    const regularSeries = noneDirectionVariants.map(variant => {
      const d = properties[variant];
      return {
        ...d,
        name: variant,
        ...seriesStyle.find(s => s.name === variant),
        yAxis: 0,
      };
    });

    const allSeries = [...regularSeries];

    if (showDirection) {
      if (properties[buoyDataDirectionVariant]) {
        const directionSeries = processDirectionData(properties[buoyDataDirectionVariant]);
        if (directionSeries) {
          allSeries.push(directionSeries);
        }
      }
    }
    return allSeries;
  }, [data, showDirection]);

  const subtitle = useMemo(
    () =>
      `Position:  ( lng: ${geometry.coordinates[0].toFixed(2)} lat: ${geometry.coordinates[1].toFixed(2)} )`,
    [geometry.coordinates],
  );

  const yAxisConfig = useMemo(() => {
    if (!showDirection) {
      // Single axis when no direction arrows
      return {
        gridLineWidth: 1,
        lineWidth: 0,
        tickWidth: 0,
        title: { text: 'Wave Height (m)' },
        labels: { style: { fontSize: '12px' } },
        offset: 0,
      };
    }

    return [
      // Primary axis for wave data (takes up most of chart)
      {
        gridLineWidth: 1,
        lineWidth: 0,
        tickWidth: 0,
        title: { text: 'Wave Height (m)' },
        labels: { style: { fontSize: '12px' } },
        offset: 0,
        height: '85%', // Use 85% of chart height
        top: '5%', // Start 5% from top
      },
      // Secondary axis for arrows (small space at bottom)
      {
        title: { text: null },
        labels: { enabled: false },
        gridLineWidth: 0,
        lineWidth: 0,
        tickWidth: 0,
        visible: false,
        height: '10%', // Use 10% of chart height
        top: '90%', // Position at 90% from top (bottom area)
        min: -1, // Fixed range for arrow positioning
        max: 1,
        offset: 0,
      },
    ];
  }, [showDirection]);

  if (error) return <div>error</div>;
  if (loading) return <div>loading</div>;

  return (
    <LineChart
      width={'100%'}
      height={500}
      series={seriseData!}
      subtitle={subtitle}
      title={data?.metadata.location}
      turboThreshold={4000}
      rangeSelector={{
        enabled: true,
        selected: 4,
        buttonPosition: {
          align: 'left',
          x: 0,
          y: 0,
        },

        inputPosition: {
          align: 'right',
          x: 0,
          y: 0,
        },
        inputBoxBorderColor: '#cccccc',
        inputBoxWidth: 120,
        inputBoxHeight: 20,
        inputStyle: {
          color: '#333333',
          fontSize: '12px',
          fontFamily: 'Arial, sans-serif',
          background: 'white',
          border: '1px solid #cccccc',
          zIndex: 10,
          opacity: 1,
          textAlign: 'center',
          padding: '2px 4px',
        },
        inputDateFormat: '%Y-%m-%d',
        inputEditDateFormat: '%Y-%m-%d',
        floating: false,
        y: -50,
        buttons: [
          { type: 'day', count: 1, text: '24H' },
          { type: 'day', count: 7, text: '1W' },
          { type: 'month', count: 1, text: '1M' },
          { type: 'month', count: 3, text: '3M' },
          { type: 'all', text: 'All' },
        ],
      }}
      navigator={{
        enabled: true,
        height: 50,
        margin: 10,
      }}
      chart={{
        marginTop: 80,
        marginBottom: 80,
        spacing: [10, 10, 15, 10],
      }}
      scrollbar={{ enabled: true, height: 20 }}
      responsive={true}
      xAxis={{
        type: 'datetime',
        // title: { text: 'Date & Time' },
        labels: { format: '{value:%H:%M}' },
        offset: 0,
      }}
      yAxis={yAxisConfig}
      plotOptions={{
        series: {
          clip: true,
          cropThreshold: 0,
        },
      }}
      tooltip={{
        shared: true,
        customFormatter: point => {
          if (point.series.name === buoyDataDirectionVariant) {
            return `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.options?.direction?.toFixed(1)}°</b> (to)<br/>`;
          }
          return `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y?.toFixed(2)} m</b><br/>`;
        },
      }}
    />
  );
};
export default WaveBuoyChart;
