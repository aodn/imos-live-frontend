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
 * Transform a direction time-series into a scatter-series whose markers
 * are direction-pointing arrow SVGs, anchored to a fixed y-position below
 * the main plot area.
 */
export function processDirectionData(data: SiteItemContent): SeriesData | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // Anchor arrows 10% below the bottom of the chart's primary axis.
  const arrowYPosition = -0.1;

  const processedData = data.map(point => {
    const [timestamp, direction] = point as [number, number];
    return {
      x: timestamp,
      y: arrowYPosition,
      direction,
      marker: {
        symbol: `url(${createDirectionArrow(direction)})`,
      },
    };
  });

  return {
    name: readableVariantName(buoyDataDirectionVariant),
    type: 'scatter',
    data: processedData,
    color: directionColors.direction,
    marker: {
      enabled: true,
      radius: 10,
      symbol: 'circle',
    },
    zIndex: 1, // below data lines
    yAxis: 1, // secondary axis
    showInLegend: true,
  };
}
