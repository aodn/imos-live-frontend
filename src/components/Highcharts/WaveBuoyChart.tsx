import { BuoyDataVariants, WaveBuoyPositionFeature } from '@/types';
import { LineChart } from './LineChart';
import { toWaveBuoyChartData } from '@/utils';
import { useWaveBuoyDetails } from '@/hooks';
import { useMemo } from 'react';
import { SeriesData } from './type';

const buoyDataVariants: BuoyDataVariants[] = [
  'WPPE',
  'WPDS',
  'WPDI',
  'SSWMD',
  // 'WAVE_quality_control',
  'WMDS',
  'WPFM',
  'WSSH',
];

const colors = [
  '#e17055',
  '#0984e3',
  '#00b894',
  '#6c5ce7',
  '#fdcb6e',
  '#d63031',
  '#74b9ff',
  '#55efc4',
];

function generateSeriesStyles(viriants: string[]): Partial<SeriesData>[] {
  return viriants.map((v, index) => ({
    name: v,
    color: colors[index % colors.length],
    type: 'line',
    lineWidth: 2,
    marker: {
      enabled: true,
      radius: 2,
      symbol: 'circle',
    },
  }));
}

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyPositionFeature, 'type'>[];
};

const WaveBuoyChart = ({ waveBuoysData }: WaveBuoyChartProps) => {
  const { dateString, buoy, geometry } = toWaveBuoyChartData(waveBuoysData);
  const { data, loading, error } = useWaveBuoyDetails(dateString, buoy);

  const seriseData: SeriesData[] = useMemo(() => {
    if (!data) return [];
    const { features } = data;
    if (!features.length) return [];

    const properties = features[0].properties;

    const seriesStyle = generateSeriesStyles(buoyDataVariants);

    return buoyDataVariants.map(variant => {
      const d = properties[variant];
      return {
        ...d,
        name: variant,
        ...seriesStyle.find(s => s.name === variant),
      };
    });
  }, [data]);

  const subtitle = useMemo(
    () =>
      `Position:  ( lng: ${geometry.coordinates[0].toFixed(2)} lat: ${geometry.coordinates[1].toFixed(2)} )`,
    [geometry.coordinates],
  );

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
        marginBottom: 100,
        spacing: [10, 10, 15, 10],
      }}
      scrollbar={{ enabled: true, height: 20 }}
      responsive={true}
      xAxis={{
        type: 'datetime',
        title: { text: 'Date & Time' },
        labels: { format: '{value:%m/%d}' },
        offset: 0,
      }}
      yAxis={{
        gridLineWidth: 1,
        lineWidth: 0,
        tickWidth: 0,
        title: { text: null },
        labels: { style: { fontSize: '12px' } },
        offset: 0,
      }}
      plotOptions={{
        series: {
          clip: true,
          cropThreshold: 0,
        },
      }}
      tooltip={{
        shared: true,
      }}
    />
  );
};
export default WaveBuoyChart;
