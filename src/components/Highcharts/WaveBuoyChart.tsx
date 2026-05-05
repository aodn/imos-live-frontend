import logoUrl from '@/assets/imos_logo_with_title.png';
import { getWaveBuoyDetails, getWaveBuoyLatestDate } from '@/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { WaveBuoyPositionFeature } from '@/types';
import {
  formatLatLngToDirectional,
  toCompactDate,
  toLocalDateTime,
  toWaveBuoyChartData,
  today,
} from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { buoyDataDirectionVariant, noneDirectionVariants, VariantReadableName } from './config';
import { LatestObservation } from './LatestObservation';
import { LineChart } from './LineChart';
import type { SeriesData } from './type';
import {
  calculateDataRange,
  generateDynamicButtons,
  generateSeriesStyles,
  processDirectionData,
} from './utils';
import { useMapUIStore } from '@/store';

dayjs.extend(utc);

export const WAVE_BUOY_MIN_DATE = 30;

type WaveBuoyChartProps = {
  waveBuoysData: Omit<WaveBuoyPositionFeature, 'type'>[];
  showDirection?: boolean;
};

function WaveBuoyChart({ waveBuoysData, showDirection }: WaveBuoyChartProps) {
  const { buoy, geometry } = toWaveBuoyChartData(waveBuoysData);
  const selectedDate = useMapUIStore(s => s.date);

  const { data: latestWaveBuoyDate, isLoading: isLatestWaveBuoyDateLoading } = useQuery({
    queryKey: ['wave_buoy_latest_date'],
    queryFn: getWaveBuoyLatestDate,
    select: data => toCompactDate(data),
  });

  const { from, to } = useMemo(() => {
    const end = dayjs(latestWaveBuoyDate ?? today()).add(1, 'day'); // Include the full selectedDate day in local time
    const start = dayjs(selectedDate).subtract(WAVE_BUOY_MIN_DATE, 'day'); // Start from 30 days before the selected date
    return { from: start.toDate(), to: end.toDate() };
  }, [selectedDate, latestWaveBuoyDate]);

  const {
    isLoading,
    isError,
    data: feature,
  } = useQuery({
    queryKey: ['waveBuoyDetails', buoy, from.toISOString(), to.toISOString()],
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
    return `<span style="font-size: 18px; font-weight: 600;">${buoy}</span> <span style="font-size: 14px;">(${formatLatLngToDirectional(
      geometry.coordinates[1],
      geometry.coordinates[0],
    )})</span>`;
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
        title: { text: undefined },
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
  if (isLoading || isLatestWaveBuoyDateLoading) return <div>loading</div>;
  if (isFeatureEmpty)
    return (
      <div>
        <h2 className="text-center font-bold">{title}</h2>
        <p>Sorry! No Data for this buoy.</p>
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
          enabled: true,
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
          y: -20,
          buttons: dynamicButtons,
        }}
        navigator={{
          enabled: true,
          height: 50,
          margin: 10,
        }}
        chart={{
          marginTop: 30,
          marginBottom: 60,
          spacing: [10, 10, 25, 10],
        }}
        scrollbar={{ enabled: true, height: 20 }}
        responsive={true}
        xAxis={{
          type: 'datetime',
          labels: { format: '{value:%b %e %H:%M}' },
          offset: 0,
          // When no xAxis.minRange is set, Highcharts Stock auto-computes it as roughly 5× the data point interval for the loaded series.
          // For buoys that report every 3–6 hours, this gives a minRange of ~15–30 hours — larger than 6H or 12H, so Highcharts silently
          // rejects those zoom levels. Buoys with hourly or sub-hourly data land below 24H, so all buttons work. Therefore, we set this as 1 hour.
          minRange: 3600 * 1000,
          plotLines: [
            {
              value: dayjs(selectedDate).valueOf(),
              color: '#3b6e8f',
              width: 2,
              dashStyle: 'Dash',
              zIndex: 5,
              label: {
                text: dayjs(selectedDate).format('D MMM YYYY'),
                rotation: 0,
                align: 'center',
                verticalAlign: 'top',
                y: -6,
                style: {
                  color: '#3b6e8f',
                  fontWeight: 'bold',
                  fontSize: '12px',
                },
              },
            },
          ],
        }}
        yAxis={yAxisConfig}
        plotOptions={{
          series: {
            clip: true,
            cropThreshold: 0,
          },
        }}
        legend={{ enabled: false }}
        exporting={{ enabled: true, watermarkUrl: logoUrl, formats: ['png', 'csv', 'xls'] }}
        tooltip={{
          shared: true,
          split: false,
          useHTML: true,
          customFormatter: tooltipFormatter,
        }}
      />
      {feature && feature.properties && <LatestObservation feature={feature} />}
    </div>
  );
}

export default WaveBuoyChart;
