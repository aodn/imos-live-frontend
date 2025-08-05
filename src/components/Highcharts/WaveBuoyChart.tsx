import { BuoyItemContent, WaveBuoyPositionFeature } from '@/types';
import { LineChart } from './LineChart';
import {
  createMergedCollectionWithAllParameters,
  getLast7Dates,
  toLocalDateTime,
  toWaveBuoyChartData,
} from '@/utils';
import { useCallback, useMemo } from 'react';
import { SeriesData } from './type';
import {
  buoyDataDirectionVariant,
  buoyDataInfoVariant,
  noneDirectionVariants,
  VariantReadableName,
} from './config';
import {
  calculateDataRange,
  generateDynamicButtons,
  generateSeriesStyles,
  processDirectionData,
} from './utils';
import { getWaveBuoyDetails } from '@/api';
import { LatestObservation } from './LatestObservation';
import { useQueries } from '@tanstack/react-query';
import { cacheConfig } from '@/config';

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyPositionFeature, 'type'>[];
  showDirection?: boolean;
};

type DataLookup<T extends string> = Record<T, BuoyItemContent<T>>;

const WaveBuoyChart = ({ waveBuoysData, showDirection }: WaveBuoyChartProps) => {
  const { dateString, buoy, geometry } = toWaveBuoyChartData(waveBuoysData);
  const latestSevendays = getLast7Dates(dateString);

  const queryResults = useQueries({
    queries: latestSevendays.map(date => {
      return {
        queryKey: [buoy, date],
        queryFn: () => getWaveBuoyDetails(date, buoy),
        enabled: !!date,
        ...cacheConfig(date),
      };
    }),
  });

  const isLoading = queryResults.some(query => query.isLoading);
  const isError = queryResults.every(query => query.isError);
  const multiData = queryResults.filter(query => query.isSuccess).map(query => query.data);

  const data = createMergedCollectionWithAllParameters(multiData || []);

  const dataLookup = useMemo(() => {
    if (!data?.features?.length) return {} as DataLookup<(typeof buoyDataInfoVariant)[number]>;

    const properties = data.features[0].properties;
    return buoyDataInfoVariant.reduce(
      (acc, variant) => {
        if (properties[variant]) {
          acc[variant] = properties[variant];
        }
        return acc;
      },
      {} as DataLookup<(typeof buoyDataInfoVariant)[number]>,
    );
  }, [data]);

  const seriseData: SeriesData[] = useMemo(() => {
    if (!data) return [];
    const { features } = data;
    if (!features.length) return [];

    const properties = features[0].properties;

    const seriesStyle = generateSeriesStyles(noneDirectionVariants);

    const regularSeries = noneDirectionVariants.map(variant => {
      const d = properties[variant];

      return {
        ...d,
        ...seriesStyle.find(s => s.name === variant),
        //update name from variant like SSMD... to like wave height..., this is to update legend label to readable name.
        name:
          variant in VariantReadableName
            ? VariantReadableName[variant as keyof typeof VariantReadableName]
            : variant,
        yAxis: 0,
      };
    });

    const directionSeries = showDirection
      ? processDirectionData(properties[buoyDataDirectionVariant])
      : null;

    return directionSeries ? [...regularSeries, directionSeries] : [...regularSeries];
  }, [data, showDirection]);

  const dynamicButtons = useMemo(() => {
    const dataRange = calculateDataRange(seriseData);
    return generateDynamicButtons(dataRange);
  }, [seriseData]);

  //select middle button.
  const defaultSelected = useMemo(() => {
    const buttonCount = dynamicButtons.length;
    if (buttonCount <= 2) return buttonCount - 1;
    return Math.floor(buttonCount / 2);
  }, [dynamicButtons]);

  const title = useMemo(() => {
    return (
      buoy + ' ' + `( ${geometry.coordinates[1].toFixed(2)}, ${geometry.coordinates[0].toFixed(2)})`
    );
  }, [buoy, geometry.coordinates]);

  const tooltipFormatter = useCallback(
    (context: any) => {
      const point = context.point;
      const datetime = toLocalDateTime(point.x);

      let tooltipHTML = `<div style="font-size: 12px;"><b>Time:</b> ${datetime}<br/>`;

      if (point.series.name === VariantReadableName[buoyDataDirectionVariant]) {
        //display wave direciton and period
        const wavePeriodPoint = dataLookup.WPFM?.data.find(
          d => Array.isArray(d) && d[0] === point.x,
        );

        const wavePeriod =
          wavePeriodPoint && Array.isArray(wavePeriodPoint) ? wavePeriodPoint[1] : null;

        const direction = point.options?.direction || point.y;
        tooltipHTML += `<span style="color:${point.color}">●</span> <b>${VariantReadableName.SSWMD}:</b> ${direction?.toFixed(1)}° (to)<br/><span style="color:${point.color}">●</span> <b>${VariantReadableName.WPFM}:</b> ${wavePeriod} s<br/>`;
      } else {
        //display wave height
        tooltipHTML += `<span style="color:${point.color}">●</span> <b>${VariantReadableName.WSSH}:</b> ${point.y?.toFixed(2)} m<br/>`;
      }

      tooltipHTML += '</div>';
      return tooltipHTML;
    },
    [dataLookup],
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

  if (isError) return <div>error</div>;
  if (isLoading) return <div>loading</div>;

  return (
    <div className="w-full">
      <LineChart
        width={'100%'}
        height={500}
        series={seriseData!}
        title={title}
        turboThreshold={4000}
        rangeSelector={{
          enabled: false,
          selected: defaultSelected,
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
          buttons: dynamicButtons,
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
          labels: { format: '{value:%b %e %H:%M}' },
          offset: 0,
        }}
        yAxis={yAxisConfig}
        plotOptions={{
          series: {
            clip: true,
            cropThreshold: 0,
          },
        }}
        exporting={{ enabled: false }}
        tooltip={{
          shared: true,
          split: false,
          useHTML: true,
          customFormatter: tooltipFormatter,
        }}
      />
      <LatestObservation multiData={multiData} />
    </div>
  );
};

export default WaveBuoyChart;
