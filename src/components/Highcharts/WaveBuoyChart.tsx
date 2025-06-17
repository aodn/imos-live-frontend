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
      height={350}
      series={[
        {
          color: '#8b5cf6',
          data: data,
          lineWidth: 2,
          name: 'Wave Buoys Count',
          type: 'spline',
        },
      ]}
      subtitle={subtitle}
      title="Wave Buous Data"
      xAxis={{
        labels: {
          format: '{value:%Y-%m}',
        },
        title: {
          text: 'Date',
        },
        type: 'datetime',
      }}
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
