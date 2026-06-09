import type Highcharts from 'highcharts/highstock';
import { colors } from '../config';
import type { SeriesData } from '../type';

/** Whitelist of marker symbols Highcharts accepts on a point. */
const VALID_MARKER_SYMBOLS = ['circle', 'square', 'diamond', 'triangle', 'triangle-down'] as const;

export function sanitizeMarker(
  marker?: Highcharts.PointMarkerOptionsObject,
): Highcharts.PointMarkerOptionsObject | undefined {
  if (!marker) return undefined;

  return {
    ...marker,
    symbol:
      marker.symbol && (VALID_MARKER_SYMBOLS as readonly string[]).includes(marker.symbol)
        ? marker.symbol
        : 'circle',
    enabled: marker.enabled !== false,
    radius: typeof marker.radius === 'number' ? marker.radius : 4,
  };
}

export function processSeries(
  series: SeriesData[],
  themedColors: string[],
  onPointClick?: (point: Highcharts.Point) => void,
  onSeriesClick?: (series: Highcharts.Series) => void,
): Highcharts.SeriesOptionsType[] {
  return series.map((s, index) => {
    const seriesConfig: Record<string, unknown> = {
      type: s.type || 'line',
      name: s.name,
      data: s.data,
      color: s.color || themedColors[index % themedColors.length],
      lineWidth: s.lineWidth,
      dashStyle: s.dashStyle,
      visible: s.visible !== false,
      showInLegend: s.showInLegend !== false,
      yAxis: s.yAxis || 0,
      zIndex: s.zIndex,
    };

    if (s.marker) {
      const sanitizedMarker = sanitizeMarker(s.marker);
      if (sanitizedMarker) {
        seriesConfig.marker = sanitizedMarker;
      }
    }

    if (onPointClick) {
      seriesConfig.point = {
        events: {
          click: function (this: Highcharts.Point) {
            onPointClick(this);
          },
        },
      };
    }

    if (onSeriesClick) {
      seriesConfig.events = {
        click: function (this: Highcharts.Series) {
          onSeriesClick(this);
        },
      };
    }

    // Cast through `unknown` because `SeriesOptionsType` is a discriminated
    // union; structurally building one field-by-field can't be narrowed by TS.
    return seriesConfig as unknown as Highcharts.SeriesOptionsType;
  });
}

export function generateSeriesStyles(variants: string[]): Record<string, Partial<SeriesData>> {
  return Object.fromEntries(
    variants.map(v => [
      v,
      {
        name: v,
        // TODO: temporarily set every variant to the same colour pending a
        // colour-assignment review.
        color: colors[0],
        type: 'line' as const,
        lineWidth: 2,
        marker: {
          enabled: true,
          radius: 2,
          symbol: 'circle',
        },
      },
    ]),
  );
}
