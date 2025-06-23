import { WaveBuoyOgcFeature } from '@/types';
import { LineChart } from './LineChart';
import { toWaveBuoyChartData } from '@/utils';
import { useWaveBuoyDetails } from '@/hooks';
import { useMemo } from 'react';
import { SeriesData } from './type';

const seriesStyle: Partial<SeriesData>[] = [
  {
    name: 'WPPE',
    color: '#e17055',
    type: 'line',
    lineWidth: 2,
    marker: { enabled: true, radius: 2, symbol: 'circle' },
  },
  {
    name: 'WPDS',
    color: '#0984e3',
    type: 'spline',
    lineWidth: 2,
    marker: { enabled: true, radius: 2, symbol: 'square' },
  },
  {
    name: 'WHTH',
    color: '#00b894',
    type: 'line',
    lineWidth: 2,
    marker: { enabled: true },
  },
];

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyOgcFeature, 'type'>[];
};

const WaveBuoyChart = ({ waveBuoysData }: WaveBuoyChartProps) => {
  const { date, geometry } = toWaveBuoyChartData(waveBuoysData);
  const { data, loading, error } = useWaveBuoyDetails(
    date.toISOString(),
    geometry.coordinates[1],
    geometry.coordinates[0],
  );

  const seriseData: SeriesData[] | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data?.map(d => ({
      ...d,
      ...seriesStyle.find(s => s.name === d.name),
    }));
  }, [data]);

  const subtitle = `Location: ( lng: ${geometry.coordinates[0].toFixed(2)} lat: ${geometry.coordinates[1].toFixed(2)} )`;
  if (error) return <div>error</div>;
  if (loading) return <div>loading</div>;
  if (!data || data.length === 0) return null;

  return (
    <LineChart
      width={'100%'}
      height={500}
      series={seriseData!}
      subtitle={subtitle}
      title="Wave Buous Data"
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
//TODOS: 1. the data will be fetched through api calling based on the date, geometry. 2. there should be a conditional rendering,
// if failed to get data, render error message. Otherwise, render this linechart. When fetching, display a loader.

/**
 * Task: 1. plot wave buoys data in circles on map. 2. should be able to select date range, then only wave buoys data within this
 * date range will be plotted on map. 3. when click on a wave buoy circle(point), the bottom drawer triggered, time series LineChart
 * will appear inside this drawer, and this chart will display time series data of this wave buoy point.
 *
 * How to make it: 1. create wave buoy layer and change wave buouy layer's data source as date change. 2. when click a wave buoy point
 * on map, get this point's date and geometry coordinate. 3. the drawer triggered, make api call with the date and coordinate as query params
 * to get this point's time series data. If succeed, add the time series data to series props of linechart.
 *
 *
 * Current problems: 1. we do not have a endpoint to return wave buoys data on daily basis, currently it is month basis. so we need to
 * have an endpoint getting daily data. 2. We do not have a endpoint to get one specific buoy's time series data based on date and coordinates.
 * Currently, I have a csv file called apollpBat.csv under public folder given by Eduardo and it can be used as mock time serise data for every
 * buoy point. But the correct way to do this is still we have an endpoint to get this data.
 *
 * My current temporary dev way: 1. define each wave buoy time series data types that returned from API. 2. create a function to convert
 * this csv file to expected type. 3. pre-process this csv file using the function and generate a json file saved under public. 3. use axios call
 * to get response from this pre-preocessed json file. 4. add the response data to linechart.
 */
