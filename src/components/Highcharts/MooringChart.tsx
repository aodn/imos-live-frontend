import { getMooringDetails, getMooringLatestDate } from '@/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { MooringDataVariants, NominalDepthVariant, SiteFeature } from '@/types';
import type { TIMEZONE } from '@/store';
import { toSiteChartData } from '@/helpers';
import { formatLatLngToDirectional, utcToTimezoneString } from '@/utils';
import { Dropdown } from '@/components/Dropdown';
import { useDidMountEffect } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { colors, PRIMARY_COLOR } from './config';
import { LineChart } from './LineChart';
import type {
  LineChartExposedMethods,
  RangeSelectorConfig,
  SeriesData,
  TooltipFormatterContext,
} from './type';
import { calculateDataRange, generateDynamicButtons } from './utils';
import { ObservationPanel, type ObservationData } from './LatestObservation';
import { useMapUIStore } from '@/store';
import type Highcharts from 'highcharts/highstock';

dayjs.extend(utc);

export const MOORING_MIN_DATE = 30;

const MOORING_DATA_GAP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type MooringVariableMeta = { key: MooringDataVariants; label: string; unit: string };
const MOORING_VARIABLES: readonly MooringVariableMeta[] = [
  { key: 'TEMP', label: 'Temperature', unit: '°C' },
  { key: 'PSAL', label: 'Salinity', unit: '' },
  { key: 'DOX1', label: 'Dissolved O₂', unit: 'µmol L⁻¹' },
];

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

// Shared tooltip for the active variable: one row per depth, values labelled with
// the variable's unit.
function buildMooringTooltipHTML(
  context: TooltipFormatterContext,
  unit: string,
  timezone: TIMEZONE,
): string {
  const points = context.points ?? [context.point];
  const datetime = utcToTimezoneString(
    (points[0]?.x ?? context.point.x) as number,
    timezone,
    'YYYY-MM-DD HH:mm:ss',
  );

  let html = `<div style="font-size: 12px;"><b>Time:</b> ${datetime}<br/>`;
  for (const point of points) {
    const value = point.y?.toFixed(2) ?? '–';
    html += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${value}${unit ? ` ${unit}` : ''}</b><br/>`;
  }
  return html + '</div>';
}

// Dashed plot line marking the selected date — shared by the initial x-axis config
// and the imperative date update (see useDidMountEffect on selectedDate).
function buildMooringDatePlotLine(
  selectedDate: string,
  timezone: TIMEZONE,
): Highcharts.XAxisPlotLinesOptions {
  const date = timezone === 'UTC' ? dayjs.utc(selectedDate) : dayjs(selectedDate);
  return {
    value: date.valueOf(),
    color: PRIMARY_COLOR,
    width: 2,
    dashStyle: 'Dash',
    zIndex: 5,
    label: {
      text: date.format('D MMM YYYY'),
      rotation: 0,
      align: 'center',
      verticalAlign: 'top',
      y: -6,
      style: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: '12px' },
    },
  };
}

// X axis with the dashed plot line marking the selected date.
function buildMooringXAxisConfig(
  selectedDate: string,
  timezone: TIMEZONE,
): Highcharts.XAxisOptions {
  return {
    type: 'datetime',
    // Mooring data arrives at irregular real-world intervals (15min to several hours).
    // Highstock's default ordinal axis spaces points evenly by index and derives tick
    // labels from those positions, which makes label time-deltas look inconsistent
    // (e.g. 2h then 1h) even though the pixel spacing looks even. Disabling ordinal
    // makes the axis a true linear time scale so tick labels land on evenly-spaced,
    // "nice" time intervals regardless of the underlying data gaps.
    ordinal: false,
    labels: { format: '{value:%b %e %H:%M}' },
    offset: 0,
    minRange: 3600 * 1000,
    plotLines: [buildMooringDatePlotLine(selectedDate, timezone)],
  };
}

// Y-axis title for a variable, e.g. "Temperature (°C)" (no unit for salinity).
function mooringYAxisTitle(variable: MooringVariableMeta): string {
  return variable.unit ? `${variable.label} (${variable.unit})` : variable.label;
}

// Single Y-axis titled with the active variable's unit.
function buildMooringYAxis(variable?: MooringVariableMeta): Highcharts.YAxisOptions[] {
  if (!variable) return [];
  return [
    {
      gridLineWidth: 1,
      lineWidth: 0,
      tickWidth: 0,
      title: { text: mooringYAxisTitle(variable) },
      labels: { style: { fontSize: '12px' } },
      offset: 0,
    },
  ];
}

// Static range-selector chrome; `selected` and `buttons` are filled in per render.
const MOORING_RANGE_SELECTOR: Omit<RangeSelectorConfig, 'selected' | 'buttons'> = {
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
  y: -48,
};

export function MooringChart({ mooringData }: MooringChartProps) {
  const mooringChartData = useMemo(
    () => (mooringData.length > 0 ? toSiteChartData(mooringData) : null),
    [mooringData],
  );
  const site = mooringChartData?.site ?? '';
  const selectedDate = useMapUIStore(s => s.date);
  const timezone = useMapUIStore(s => s.timezone);
  const visibleRangeRef = useRef<{ min: string; max: string } | null>(null);
  const chartRef = useRef<LineChartExposedMethods>(null);
  // The single variable currently shown; defaults to temperature.
  const [selectedVar, setSelectedVar] = useState<MooringDataVariants>('TEMP');

  const { data: latestMooringDate, isLoading: isLatestMooringDateLoading } = useQuery({
    queryKey: ['mooring_latest_date', timezone],
    queryFn: () => getMooringLatestDate(timezone),
  });

  const { from, to } = useMemo(() => {
    const parse = timezone === 'UTC' ? dayjs.utc : dayjs;
    const end = parse(latestMooringDate ?? utcToTimezoneString(new Date(), timezone)).add(1, 'day'); // Include the full selectedDate day
    const start = parse(selectedDate).subtract(MOORING_MIN_DATE, 'day'); // Start from 30 days before the selected date
    return { from: start.toDate(), to: end.toDate() };
  }, [selectedDate, latestMooringDate, timezone]);

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

  const depthKeys = useMemo(() => {
    if (isFeatureEmpty) return [];
    return Object.keys(feature.properties)
      .filter(key => key.startsWith('NOMINAL_DEPTH_'))
      .sort((a, b) => depthValue(a) - depthValue(b)) as NominalDepthVariant[];
  }, [feature?.properties, isFeatureEmpty]);

  // Variables that actually have data at some depth — only these get a selector button.
  const availableVars = useMemo(() => {
    if (isFeatureEmpty) return [];
    return MOORING_VARIABLES.filter(v =>
      depthKeys.some(key => (feature.properties[key]?.[v.key]?.length ?? 0) > 0),
    );
  }, [feature?.properties, isFeatureEmpty, depthKeys]);

  // The chart shows one variable at a time; fall back to the first available one
  // if the chosen variable has no data for this mooring.
  const activeVar = useMemo(
    () => availableVars.find(v => v.key === selectedVar) ?? availableVars[0],
    [availableVars, selectedVar],
  );
  // Latest active variable for callbacks/effects that run against the long-lived
  // (allowChartUpdate={false}) chart and must see the current value, not a stale closure.
  const activeVarRef = useRef(activeVar);
  activeVarRef.current = activeVar;

  const seriesData: SeriesData[] = useMemo(() => {
    if (isFeatureEmpty || !activeVar) return [];
    return depthKeys.flatMap((key, i): SeriesData[] => {
      const depth = depthValue(key);
      const raw = feature.properties[key]?.[activeVar.key] ?? [];
      if (raw.length === 0) return [];
      return [
        {
          name: `${depth} m`,
          data: [...raw].sort((a, b) => a[0] - b[0]),
          color: colors[i % colors.length],
          type: 'line',
          lineWidth: 2,
          marker: { enabled: true, radius: 2, symbol: 'circle' },
          yAxis: 0,
        },
      ];
    });
  }, [feature?.properties, isFeatureEmpty, depthKeys, activeVar]);

  // Latest reading of the active variable at each depth — one cell per depth.
  const observationData: ObservationData = useMemo(() => {
    if (isFeatureEmpty || !activeVar) return [];
    return depthKeys.flatMap((key): ObservationData => {
      const last = (feature.properties[key]?.[activeVar.key] ?? []).at(-1);
      if (!Array.isArray(last)) return [];
      const [timeStamp, value] = last;
      return [
        {
          timeStamp,
          label: `${depthValue(key)} m`,
          value: value?.toFixed(2),
          unit: activeVar.unit,
        },
      ];
    });
  }, [feature?.properties, isFeatureEmpty, depthKeys, activeVar]);

  const yAxisConfig = useMemo(() => buildMooringYAxis(activeVar), [activeVar]);

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
    (context: TooltipFormatterContext) =>
      buildMooringTooltipHTML(context, activeVarRef.current?.unit ?? '', timezone),
    [timezone],
  );

  const xAxisConfig = useMemo(
    () => buildMooringXAxisConfig(selectedDate, timezone),
    [selectedDate, timezone],
  );

  useDidMountEffect(() => {
    const chart = chartRef.current?.getChartInstance();
    if (!chart || !activeVar) return;
    chart.yAxis[0]?.setTitle({ text: mooringYAxisTitle(activeVar) });
    chartRef.current?.updateSeries(seriesData);
  }, [seriesData]);

  useDidMountEffect(() => {
    const chart = chartRef.current?.getChartInstance();
    chart?.xAxis[0]?.update({ plotLines: [buildMooringDatePlotLine(selectedDate, timezone)] });
  }, [selectedDate, timezone]);

  const updateVisibleRange = useCallback(
    (min: number, max: number) => {
      visibleRangeRef.current = {
        min: utcToTimezoneString(min, timezone, 'YYYYMMDD'),
        max: utcToTimezoneString(max, timezone, 'YYYYMMDD'),
      };
    },
    [timezone],
  );

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
    <div className="relative w-full">
      {availableVars.length > 1 && (
        <div className="absolute right-10 top-2 z-10">
          <Dropdown
            key={activeVar?.key}
            size="sm"
            className="w-32"
            options={availableVars.map(v => ({ value: v.key, label: v.label }))}
            initialValue={activeVar?.key}
            onChange={value => setSelectedVar(value as MooringDataVariants)}
          />
        </div>
      )}
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
        yAxis={yAxisConfig}
        plotOptions={{
          series: {
            clip: true,
            cropThreshold: 0,
            gapSize: MOORING_DATA_GAP_THRESHOLD_MS,
            gapUnit: 'value',
          },
        }}
        legend={{ enabled: true }}
        exporting={{
          enabled: true,
          selectedDate,
          filename: () => {
            const { min, max } = visibleRangeRef.current ?? {};
            return min && max ? `${site}_${min}_${max}` : `${site}`;
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
      <ObservationPanel observationData={observationData} />
    </div>
  );
}
