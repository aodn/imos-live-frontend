import { buoyDataDirectionVariant, directionColors, readableVariantName } from '../config';
import type { SiteItemContent } from '@/types';
import type { SeriesData } from '../type';

/**
 * Render a small SVG arrow as a data URI, rotated so it points in the direction
 * the waves are *travelling to* (180° from the source direction the buoy reports).
 *
 * Wave direction convention: 0° = North, 90° = East, etc. (clockwise positive).
 */
export function createDirectionArrow(
  direction: number,
  color: string = directionColors.direction,
): string {
  const arrowDirection = direction + 180; // Point where waves are travelling TO

  const arrowSvg = `
     <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${arrowDirection} 16 16)">
        <rect x="14.5" y="8" width="3" height="16" fill="${color}"/>
        <path d="M16 4 L24 12 L20 12 L16 8 L12 12 L8 12 Z" fill="${color}"/>
      </g>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(arrowSvg);
}

/**
 * Transform a direction time-series into a marker-only line series whose markers
 * are direction-pointing arrow SVGs, anchored to a fixed y-position below
 * the main plot area.
 *
 * `wavePeriodData` (the WPFM series) is paired by timestamp and stashed on each
 * point as `wavePeriod`, so the tooltip can read it straight off the point. This
 * matters because dataGrouping re-anchors a grouped point's `x` to the bucket
 * start — which no longer matches a raw WPFM timestamp — so a separate by-time
 * lookup would miss; carrying the value on the point lets grouping preserve it.
 */
export function processDirectionData(
  data: SiteItemContent,
  wavePeriodData?: SiteItemContent,
): SeriesData | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const wavePeriodByTime = new Map<number, number>();
  wavePeriodData?.forEach(point => {
    if (Array.isArray(point)) wavePeriodByTime.set(point[0] as number, point[1] as number);
  });

  // Anchor arrows 10% below the bottom of the chart's primary axis.
  const arrowYPosition = -0.1;

  const processedData = data.map(point => {
    const [timestamp, direction] = point as [number, number];
    return {
      x: timestamp,
      y: arrowYPosition,
      direction,
      wavePeriod: wavePeriodByTime.get(timestamp) ?? null,
      marker: {
        symbol: `url(${createDirectionArrow(direction)})`,
      },
    };
  });

  return {
    name: readableVariantName(buoyDataDirectionVariant),
    // A zero-width line, not a scatter: scatter series are `sorted: false`, which makes
    // Highcharts Stock skip both cropping and dataGrouping — so every arrow is drawn at
    // every zoom (a solid blob) and the custom point props get dropped. A line series is
    // sorted, so it crops to the viewport and groups; lineWidth 0 keeps it marker-only.
    type: 'line',
    lineWidth: 0,
    data: processedData,
    color: directionColors.direction,
    marker: {
      enabled: true,
      radius: 10,
      symbol: 'circle',
    },
    // Each point carries a custom `direction`/`wavePeriod` value and a per-point arrow
    // `marker`. In Highcharts Stock 12 the non-grouped point path drops those object-level
    // props for large series (only x/y survive into the data table), collapsing every arrow
    // to the series-level circle and making the tooltip read back y (-0.1°). The grouped
    // point path preserves them, so force grouping on at every zoom (`forced`) — which also
    // decimates the arrows to one-per-group when zoomed out, avoiding thousands of
    // overlapping markers over a long date range.
    dataGrouping: { enabled: true, forced: true },
    zIndex: 1, // below data lines
    yAxis: 1, // secondary axis
    showInLegend: true,
  };
}
