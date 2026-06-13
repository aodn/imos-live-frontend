import { getMooringDetails, getMooringLatestDate } from '@/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { NominalDepthVariant, SiteFeature } from '@/types';
import { toWaveBuoyChartData } from '@/helpers';
import { formatLatLngToDirectional, toCompactDate, utcToLocalDateTime, today } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { colors, PRIMARY_COLOR } from './config';
import { LineChart } from './LineChart';
import type { RangeSelectorConfig, SeriesData, TooltipFormatterContext } from './type';
import { calculateDataRange, generateDynamicButtons } from './utils';
import { useMapUIStore } from '@/store';
import type Highcharts from 'highcharts/highstock';

dayjs.extend(utc);

export const MOORING_MIN_DATE = 30;

type MooringChartProps = {
  mooringData: Omit<SiteFeature, 'type'>[];
};

// Nominal-depth property keys look like `NOMINAL_DEPTH_12.5`; pull out the numeric depth.
function depthValue(key: string): number {
  return Number(key.replace('NOMINAL_DEPTH_', ''));
}

// HTML string for the Highcharts title (rendered via useHTML on the chart).
function formatMooringTitle(site: string, lng: number, lat: number): string {
  return `<span style="font-size: 18px; font-weight: 600;">${site}</span> <span style="font-size: 14px;">(${formatLatLngToDirectional(
    lat,
    lng,
  )})</span>`;
}

// JSX equivalent for the loading/error/empty branches — React would otherwise escape the HTML.
function MooringTitleHeading({ site, lng, lat }: { site: string; lng: number; lat: number }) {
  return (
    <h2 className="text-center font-bold">
      <span className="text-lg font-semibold">{site}</span>{' '}
      <span className="text-sm font-normal">({formatLatLngToDirectional(lat, lng)})</span>
    </h2>
  );
}

// Shared tooltip: one row per depth series showing the temperature at the hovered time.
function buildMooringTooltipHTML(context: TooltipFormatterContext): string {
  const points = context.points ?? [context.point];
  const datetime = utcToLocalDateTime((points[0]?.x ?? context.point.x) as number);

  let html = `<div style="font-size: 12px;"><b>Time:</b> ${datetime}<br/>`;
  for (const point of points) {
    html += `<span style="color:${point.color}">●</span> <b>${point.series.name}:</b> ${point.y?.toFixed(2)} °C<br/>`;
  }
  return html + '</div>';
}

// X axis with the dashed plot line marking the selected date.
function buildMooringXAxisConfig(selectedDate: string): Highcharts.XAxisOptions {
  return {
    type: 'datetime',
    labels: { format: '{value:%b %e %H:%M}' },
    offset: 0,
    minRange: 3600 * 1000,
    plotLines: [
      {
        value: dayjs(selectedDate).valueOf(),
        color: PRIMARY_COLOR,
        width: 2,
        dashStyle: 'Dash',
        zIndex: 5,
        label: {
          text: dayjs(selectedDate).format('D MMM YYYY'),
          rotation: 0,
          align: 'center',
          verticalAlign: 'top',
          y: -6,
          style: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: '12px' },
        },
      },
    ],
  };
}

const MOORING_Y_AXIS: Highcharts.YAxisOptions[] = [
  {
    gridLineWidth: 1,
    lineWidth: 0,
    tickWidth: 0,
    title: { text: 'Temperature (°C)' },
    labels: { style: { fontSize: '12px' } },
    offset: 0,
  },
];

// Static range-selector chrome; `selected` and `buttons` are filled in per render.
const MOORING_RANGE_SELECTOR: Omit<RangeSelectorConfig, 'selected' | 'buttons'> = {
  enabled: true,
  buttonPosition: { align: 'left', x: 0, y: 0 },
  inputPosition: { align: 'right', x: 0, y: 0 },
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
  y: -32,
};

export function MooringChart({ mooringData }: MooringChartProps) {
  // toWaveBuoyChartData throws on empty input. Compute defensively so hooks below
  // stay in the same order across renders; render-time guard happens after the hooks.
  const mooringChartData = useMemo(
    () => (mooringData.length > 0 ? toWaveBuoyChartData(mooringData) : null),
    [mooringData],
  );
  const site = mooringChartData?.site ?? '';
  const selectedDate = useMapUIStore(s => s.date);
  const visibleRangeRef = useRef<{ min: string; max: string } | null>(null);

  const { data: latestMooringDate, isLoading: isLatestMooringDateLoading } = useQuery({
    queryKey: ['mooring_latest_date'],
    queryFn: getMooringLatestDate,
    select: data => toCompactDate(data),
  });

  const { from, to } = useMemo(() => {
    const end = dayjs(latestMooringDate ?? today()).add(1, 'day'); // Include the full selectedDate day in local time
    const start = dayjs(selectedDate).subtract(MOORING_MIN_DATE, 'day'); // Start from 30 days before the selected date
    return { from: start.toDate(), to: end.toDate() };
  }, [selectedDate, latestMooringDate]);

  const {
    isLoading,
    isError,
    data: feature,
  } = useQuery({
    queryKey: ['mooringDetails', site, from.toISOString(), to.toISOString()],
    queryFn: () => getMooringDetails(from, to, site),
    // Wait for latestMooringDate so `to` is final on first fetch.
    enabled: !!site && !isLatestMooringDateLoading,
  });

  const isFeatureEmpty = !feature || !feature.properties;

  // One temperature series per nominal depth, ordered shallow → deep so the
  // legend and color assignment are stable.
  const seriesData: SeriesData[] = useMemo(() => {
    if (isFeatureEmpty) return [];
    const properties = feature.properties;

    return Object.keys(properties)
      .filter(key => key.startsWith('NOMINAL_DEPTH_'))
      .sort((a, b) => depthValue(a) - depthValue(b))
      .flatMap((key, i): SeriesData[] => {
        const temp = properties[key as NominalDepthVariant]?.TEMP ?? [];
        if (temp.length === 0) return [];
        return [
          {
            name: `${depthValue(key)} m`,
            // Sort ascending by timestamp — Highcharts Stock silently refuses to draw
            // the main line for unsorted data (the navigator renders regardless).
            data: [...temp].sort((a, b) => a[0] - b[0]),
            color: colors[i % colors.length],
            type: 'line',
            lineWidth: 2,
            marker: { enabled: true, radius: 2, symbol: 'circle' },
            yAxis: 0,
          },
        ];
      });
  }, [feature?.properties, isFeatureEmpty]);

  const dynamicButtons = useMemo(() => {
    const dataRange = calculateDataRange(seriesData);
    return generateDynamicButtons(dataRange, '12H');
  }, [seriesData]);

  //select middle button.
  const defaultSelected = useMemo(() => {
    const buttonCount = dynamicButtons.length;
    if (buttonCount <= 2) return buttonCount - 1;
    return Math.floor(buttonCount / 2);
  }, [dynamicButtons]);

  const title = mooringChartData
    ? formatMooringTitle(
        site,
        mooringChartData.geometry.coordinates[0],
        mooringChartData.geometry.coordinates[1],
      )
    : '';

  const tooltipFormatter = useCallback(
    (context: TooltipFormatterContext) => buildMooringTooltipHTML(context),
    [],
  );

  const xAxisConfig = useMemo(() => buildMooringXAxisConfig(selectedDate), [selectedDate]);

  const updateVisibleRange = useCallback((min: number, max: number) => {
    visibleRangeRef.current = {
      min: utcToLocalDateTime(min, 'YYYYMMDD'),
      max: utcToLocalDateTime(max, 'YYYYMMDD'),
    };
  }, []);

  const handleChartLoad = useCallback(
    (chart: Highcharts.Chart) => {
      const { min, max } = chart.xAxis[0].getExtremes();
      updateVisibleRange(min, max);
    },
    [updateVisibleRange],
  );

  // Render-time guard for the defensive empty-data case (see useMemo on mooringChartData).
  if (!mooringChartData) return null;
  const [lng, lat] = mooringChartData.geometry.coordinates;
  if (isError)
    return (
      <div>
        <MooringTitleHeading site={site} lng={lng} lat={lat} />
        <p>Sorry! Failed to load data for this mooring.</p>
      </div>
    );
  if (isLoading || isLatestMooringDateLoading)
    return (
      <div>
        <MooringTitleHeading site={site} lng={lng} lat={lat} />
        <p>Loading…</p>
      </div>
    );
  if (isFeatureEmpty || seriesData.length === 0)
    return (
      <div>
        <MooringTitleHeading site={site} lng={lng} lat={lat} />
        <p>Sorry! No Data for this mooring.</p>
      </div>
    );

  return (
    <div className="w-full">
      <LineChart
        width={'100%'}
        height={500}
        series={seriesData}
        title={title}
        turboThreshold={4000}
        onChartLoad={handleChartLoad}
        onRangeSelect={updateVisibleRange}
        rangeSelector={{
          ...MOORING_RANGE_SELECTOR,
          selected: defaultSelected,
          buttons: dynamicButtons,
        }}
        navigator={{
          enabled: true,
          height: 50,
          margin: 10,
        }}
        chart={{
          marginTop: 28,
          marginBottom: 40,
          spacing: [10, 10, 10, 10],
        }}
        scrollbar={{ enabled: true, height: 20 }}
        responsive={true}
        xAxis={xAxisConfig}
        yAxis={MOORING_Y_AXIS}
        plotOptions={{
          series: {
            clip: true,
            cropThreshold: 0,
          },
        }}
        legend={{ enabled: true }}
        exporting={{
          enabled: true,
          selectedDate,
          filename: () => {
            const { min, max } = visibleRangeRef.current ?? {};
            return min && max ? `${site}-temperature_${min}_${max}` : `${site}-temperature`;
          },
          formats: ['png', 'csv', 'xls'],
        }}
        tooltip={{
          shared: true,
          split: false,
          useHTML: true,
          customFormatter: tooltipFormatter,
        }}
      />
    </div>
  );
}
