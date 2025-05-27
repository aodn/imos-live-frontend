/**
 * Calculates scaled width and height given a desired dimension,
 * keeping the aspect ratio correct, which can avoid layout shifts
 * when displaying images or other media.
 */
type DimensionType = 'width' | 'height';

interface GetScaledDimensionsParams {
  by: DimensionType;
  value: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
}

interface Dimensions {
  width: number;
  height: number;
}

export function getScaledDimensions({
  by,
  value,
  intrinsicWidth,
  intrinsicHeight,
}: GetScaledDimensionsParams): Dimensions {
  if (by === 'width') {
    const height = Math.round((intrinsicHeight / intrinsicWidth) * value);
    return { width: value, height };
  }
  if (by === 'height') {
    const width = Math.round((intrinsicWidth / intrinsicHeight) * value);
    return { width, height: value };
  }
  throw new Error('Invalid "by" argument: must be "width" or "height"');
}
