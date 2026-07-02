import { getWaveBuoyDetails, getWaveBuoyLatestDate } from '@/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { SiteFeature } from '@/types';
import { toSiteChartData } from '@/helpers';
import { formatLatLngToDirectional, utcToLocalDateTime, today } from '@/utils';
import { useDidMountEffect } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import {
  buoyDataDirectionVariant,
  noneDirectionVariants,
  PRIMARY_COLOR,
  readableVariantName,
  VariantReadableName,
} from './config';
import { LatestObservation } from './LatestObservation';
import { LineChart } from './LineChart';
import type {
  LineChartExposedMethods,
  RangeSelectorConfig,
  SeriesData,
  TooltipFormatterContext,
} from './type';
import {
  calculateDataRange,
  generateDynamicButtons,
  generateSeriesStyles,
  processDirectionData,
} from './utils';
import { useMapUIStore } from '@/store';
import type Highcharts from 'highcharts/highstock';

dayjs.extend(utc);

export const WAVE_BUOY_MIN_DATE = 30;
const WAVE_BUOY_DATA_GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type WaveBuoyChartProps = {
  waveBuoysData: Omit<SiteFeature, 'type'>[];
  showDirection?: boolean;
};

// HTML string for the Highcharts title (rendered via useHTML on the chart).
function formatBuoyTitle(buoy: string, lng: number, lat: number): string {
  return `<span style="font-size: 18px; font-weight: 600;">${buoy}</span> <span style="font-size: 14px;">(${formatLatLngToDirectional(
    lat,
    lng,
  )})</span>`;
}

// JSX equivalent for the loading/error/empty branches — React would otherwise escape the HTML.
function BuoyTitleHeading({ buoy, lng, lat }: { buoy: string; lng: number; lat: number }) {
  return (
    <h2 className="text-center font-bold">
      <span className="text-lg font-semibold">{buoy}</span>{' '}
      <span className="text-sm font-normal">({formatLatLngToDirectional(lat, lng)})</span>
    </h2>
  );
}

// HTML string for the shared tooltip. Iterate every point at the hovered x (shared
// tooltip) so both the wave-height line and the direction strip contribute — otherwise
// the single `context.point` resolves to just one series and hovering an arrow would
// only show wave height. The direction series shows direction + period; others wave height.
function buildBuoyTooltipHTML(context: TooltipFormatterContext): string {
  const points = context.points ?? (context.point ? [context.point] : []);
  if (points.length === 0) return '';

  const datetime = utcToLocalDateTime(points[0].x as number);
  let html = `<div style="font-size: 12px;"><b>Time:</b> ${datetime}<br/>`;

  for (const point of points) {
    if (point.series.name === VariantReadableName[buoyDataDirectionVariant]) {
      // direction + period are read straight off the point (set in processDirectionData):
      // dataGrouping re-anchors the grouped point's x, so a by-timestamp lookup would miss.
      const pointOptions = point.options as { direction?: number; wavePeriod?: number | null };
      const wavePeriod = pointOptions.wavePeriod ?? null;
      const direction = pointOptions.direction ?? point.y;
      html += `<span style="color:${point.color}">●</span> <b>${VariantReadableName.SSWMD}:</b> ${direction?.toFixed(1)}° (to)<br/><span style="color:${point.color}">●</span> <b>${VariantReadableName.WPFM}:</b> ${wavePeriod} s<br/>`;
    } else {
      html += `<span style="color:${point.color}">●</span> <b>${VariantReadableName.WSSH}:</b> ${point.y?.toFixed(2)} m<br/>`;
    }
  }

  return html + '</div>';
}

// Primary wave-height axis. When arrows are shown it shrinks to 85% and a hidden
// strip axis is appended at the bottom to position the direction arrows.
function buildWaveYAxisConfig(showDirection?: boolean): Highcharts.YAxisOptions[] {
  const primary: Highcharts.YAxisOptions = {
    gridLineWidth: 1,
    lineWidth: 0,
    tickWidth: 0,
    title: { text: 'Wave Height (m)' },
    labels: { style: { fontSize: '12px' } },
    offset: 0,
    ...(showDirection ? { height: '85%', top: '5%' } : {}),
  };

  if (!showDirection) return [primary];

  const arrowAxis: Highcharts.YAxisOptions = {
    title: { text: undefined },
    labels: { enabled: false },
    gridLineWidth: 0,
    lineWidth: 0,
    tickWidth: 0,
    visible: false,
    height: '10%',
    top: '90%',
    min: -1, // Fixed range for arrow positioning
    max: 1,
    offset: 0,
  };

  return [primary, arrowAxis];
}

// Dashed plot line marking the selected date — shared by the initial x-axis config
// and the imperative date update (see useDidMountEffect on selectedDate).
function buildBuoyDatePlotLine(selectedDate: string): Highcharts.XAxisPlotLinesOptions {
  return {
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
  };
}

// X axis with the dashed plot line marking the selected date.
function buildBuoyXAxisConfig(selectedDate: string): Highcharts.XAxisOptions {
  return {
    type: 'datetime',
    labels: { format: '{value:%b %e %H:%M}' },
    offset: 0,
    // When no xAxis.minRange is set, Highcharts Stock auto-computes it as roughly 5× the data point interval for the loaded series.
    // For buoys that report every 3–6 hours, this gives a minRange of ~15–30 hours — larger than 6H or 12H, so Highcharts silently
    // rejects those zoom levels. Buoys with hourly or sub-hourly data land below 24H, so all buttons work. Therefore, we set this as 1 hour.
    minRange: 3600 * 1000,
    plotLines: [buildBuoyDatePlotLine(selectedDate)],
  };
}

// Static range-selector chrome; `selected` and `buttons` are filled in per render.
const BUOY_RANGE_SELECTOR: Omit<RangeSelectorConfig, 'selected' | 'buttons'> = {
  enabled: true,
  inputEnabled: false,
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

export function WaveBuoyChart({ waveBuoysData, showDirection }: WaveBuoyChartProps) {
  // toWaveBuoyChartData throws on empty input. Compute defensively so hooks below
  // stay in the same order across renders; render-time guard happens after the hooks.
  const buoyChartData = useMemo(
    () => (waveBuoysData.length > 0 ? toSiteChartData(waveBuoysData) : null),
    [waveBuoysData],
  );
  const buoy = buoyChartData?.site ?? '';
  const selectedDate = useMapUIStore(s => s.date);
  const visibleRangeRef = useRef<{ min: string; max: string } | null>(null);
  const chartRef = useRef<LineChartExposedMethods>(null);

  const { data: latestWaveBuoyDate, isLoading: isLatestWaveBuoyDateLoading } = useQuery({
    queryKey: ['wave_buoy_latest_date'],
    queryFn: getWaveBuoyLatestDate,
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
    // Wait for latestWaveBuoyDate so `to` is final on first fetch — otherwise we'd
    // fire once with the today() fallback and refetch when the date resolves.
    enabled: !!buoy && !isLatestWaveBuoyDateLoading,
  });

  const isFeatureEmpty = !feature || !feature.properties;

  const seriesData: SeriesData[] = useMemo(() => {
    if (isFeatureEmpty) return [];

    const properties = feature.properties;

    // Buoys typically report wave height under one of WSSH/WHTH — pick the first
    // variant with data. If both exist the order in noneDirectionVariants wins.
    const seriesStyles = generateSeriesStyles(noneDirectionVariants);
    const regularVariant = noneDirectionVariants.find(
      variant => (properties[variant] ?? []).length > 0,
    );
    const regularSeries = regularVariant
      ? {
          data: properties[regularVariant],
          ...seriesStyles[regularVariant],
          // legend label uses the readable name (e.g. SSWMD → "wave direction") rather than the variant code.
          name: readableVariantName(regularVariant),
          yAxis: 0,
        }
      : null;

    const directionSeries = showDirection
      ? processDirectionData(properties[buoyDataDirectionVariant] ?? [], properties.WPFM)
      : null;

    return [regularSeries, directionSeries].filter((s): s is SeriesData => s !== null);
  }, [feature?.properties, isFeatureEmpty, showDirection]);

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

  const title = buoyChartData
    ? formatBuoyTitle(
        buoy,
        buoyChartData.geometry.coordinates[0],
        buoyChartData.geometry.coordinates[1],
      )
    : '';

  const tooltipFormatter = useCallback(
    (context: TooltipFormatterContext) => buildBuoyTooltipHTML(context),
    [],
  );

  const yAxisConfig = useMemo(() => buildWaveYAxisConfig(showDirection), [showDirection]);

  const xAxisConfig = useMemo(() => buildBuoyXAxisConfig(selectedDate), [selectedDate]);

  useDidMountEffect(() => {
    chartRef.current?.updateSeries(seriesData);
  }, [seriesData]);

  useDidMountEffect(() => {
    const chart = chartRef.current?.getChartInstance();
    chart?.xAxis[0]?.update({ plotLines: [buildBuoyDatePlotLine(selectedDate)] });
  }, [selectedDate]);

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

  // Render-time guard for the defensive empty-data case (see useMemo on buoyChartData).
  if (!buoyChartData) return null;
  const [lng, lat] = buoyChartData.geometry.coordinates;
  if (isError)
    return (
      <div>
        <BuoyTitleHeading buoy={buoy} lng={lng} lat={lat} />
        <p>Sorry! Failed to load data for this buoy.</p>
      </div>
    );
  if (isLoading || isLatestWaveBuoyDateLoading)
    return (
      <div>
        <BuoyTitleHeading buoy={buoy} lng={lng} lat={lat} />
        <p>Loading…</p>
      </div>
    );
  if (isFeatureEmpty)
    return (
      <div>
        <BuoyTitleHeading buoy={buoy} lng={lng} lat={lat} />
        <p>Sorry! No Data for this buoy.</p>
      </div>
    );

  return (
    <div className="w-full">
      <LineChart
        ref={chartRef}
        // Drive updates imperatively via the ref (see useDidMountEffect above) instead of
        // re-rendering from props: an in-place chart.update after a series swap leaves the
        // range-selector buttons unresponsive and resets the zoom.
        allowChartUpdate={false}
        width={'100%'}
        height={500}
        series={seriesData}
        title={title}
        turboThreshold={4000}
        onChartLoad={handleChartLoad}
        onRangeSelect={updateVisibleRange}
        rangeSelector={{
          ...BUOY_RANGE_SELECTOR,
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
        yAxis={yAxisConfig}
        plotOptions={{
          series: {
            clip: true,
            cropThreshold: 0,
            gapSize: WAVE_BUOY_DATA_GAP_THRESHOLD_MS,
            gapUnit: 'value',
          },
        }}
        legend={{ enabled: false }}
        exporting={{
          enabled: true,
          selectedDate,
          filename: () => {
            const { min, max } = visibleRangeRef.current ?? {};
            return min && max ? `${buoy}-waves_${min}_${max}` : `${buoy}-waves`;
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
      {/* feature is non-null here — isFeatureEmpty already early-returned above. */}
      <LatestObservation feature={feature!} />
    </div>
  );
}
