import { WaveBuoyOgcFeature } from '@/types';
import { LineChart } from './LineChart';
import { toWaveBuoyChartData } from '@/utils';

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyOgcFeature, 'type'>[];
};

const WaveBuoyChart = ({ waveBuoysData }: WaveBuoyChartProps) => {
  const { data, geometry } = toWaveBuoyChartData(waveBuoysData);
  const subtitle = `Location: ( lng: ${geometry.coordinates[0].toFixed(2)} lat: ${geometry.coordinates[1].toFixed(2)} )`;
  return (
    <LineChart
      width={'100%'}
      height={350}
      series={[
        {
          color: '#8b5cf6',
          data: data,
          lineWidth: 2,
          name: 'Wave Buoys Count',
          type: 'line',
        },
      ]}
      subtitle={subtitle}
      title="Wave Buous Data"
      rangeSelector={{
        enabled: true,
        selected: 1,
        buttons: [
          { type: 'day', count: 7, text: '7D' },
          { type: 'day', count: 30, text: '30D' },
          { type: 'month', count: 3, text: '3M' },
          { type: 'all', text: 'All' },
        ],
      }}
      navigator={{ enabled: true }}
      scrollbar={{ enabled: true }}
      responsive={true}
      yAxis={{
        labels: {
          format: '{value}',
        },
        title: {
          text: 'Count',
        },
      }}
      exporting={{
        buttons: {
          contextButton: {
            enabled: true,
          },
        },
        enabled: true,
      }}
    />
  );
};
export default WaveBuoyChart;
