/** Maps LOD number (as a string, e.g. `'2'`) to the minimum map zoom that activates it. */
export type LodZoomThresholds = Record<string, number>;

/**
 * Package default, used when a host app doesn't supply its own
 * `lodZoomThresholds` override. LOD1 is always active regardless of this map.
 */
export const DEFAULT_LOD_ZOOM_THRESHOLDS: LodZoomThresholds = {
  '2': 4,
  '3': 5,
  '4': 6,
};
