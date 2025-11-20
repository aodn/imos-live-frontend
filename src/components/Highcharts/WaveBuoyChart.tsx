import { getWaveBuoyDetails } from '@/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { WaveBuoyPositionFeature } from '@/types';
import { toLocalDateTime, toWaveBuoyChartData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { buoyDataDirectionVariant, noneDirectionVariants, VariantReadableName } from './config';
import { LatestObservation } from './LatestObservation';
import { LineChart } from './LineChart';
import { SeriesData } from './type';
import {
  calculateDataRange,
  generateDynamicButtons,
  generateSeriesStyles,
  processDirectionData,
} from './utils';

dayjs.extend(utc);

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyPositionFeature, 'type'>[];
  showDirection?: boolean;
};

const WaveBuoyChart = ({ waveBuoysData, showDirection }: WaveBuoyChartProps) => {
  const { dateString, buoy, geometry } = toWaveBuoyChartData(waveBuoysData);
  const date = dayjs(dateString);
  const from = date.utc().subtract(6, 'days').format('YYYY-MM-DDTHH:mm:ss.000000000') + 'Z';
  const to = date.utc().format('YYYY-MM-DDTHH:mm:ss.000000000') + 'Z';
  const {
    isLoading,
    isError,
    data: feature,
  } = useQuery({
    queryKey: ['waveBuoyDetails', buoy, from, to],
    queryFn: () => {
      return getWaveBuoyDetails(from, to, buoy);
    },
    enabled: !!buoy,
  });

  const isFeatureEmpty = !feature || !feature.properties;

  const seriseData: SeriesData[] = useMemo(() => {
    if (isFeatureEmpty) return [];

    const properties = feature.properties;

    const seriesStyle = generateSeriesStyles(noneDirectionVariants);
    const [regularSeries] = noneDirectionVariants
      .filter(variant => (properties[variant] ?? []).length > 0)
      .map(variant => {
        const data = properties[variant];

        return {
          data,
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

    return directionSeries ? [regularSeries, directionSeries] : [regularSeries];
  }, [feature?.properties, isFeatureEmpty, showDirection]);

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
        const wavePeriodPoint = feature?.properties.WPFM?.find(
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
    [feature],
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
  if (isFeatureEmpty)
    return (
      <div>
        <h2>{title}</h2>
      </div>
    );

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
      <LatestObservation feature={feature} />
    </div>
  );
};

export default WaveBuoyChart;
