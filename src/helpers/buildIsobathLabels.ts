type ScreenPoint = { x: number; y: number };

type Viewport = {
  width: number;
  height: number;
  project: (lngLat: [number, number]) => ScreenPoint;
  unproject: (point: ScreenPoint) => [number, number];
};

// Keep labels this many pixels inside the viewport edge.
const EDGE_MARGIN = 30;
// Minimum distance between two labels, so they don't collide.
const MIN_LABEL_GAP = 100;
// Spacing of candidate label positions along each segment.
const SAMPLE_STEP = 20;

type Candidate = { distSq: number; point: ScreenPoint; angle: number };

function getRings(geometry: GeoJSON.Geometry): GeoJSON.Position[][] {
  switch (geometry.type) {
    case 'LineString':
      return [geometry.coordinates];
    case 'MultiLineString':
    case 'Polygon':
      return geometry.coordinates;
    case 'MultiPolygon':
      return geometry.coordinates.flat();
    default:
      return [];
  }
}

// Tile clipping adds edges of constant lng or lat; they aren't real contours.
function isTileClipEdge(a: GeoJSON.Position, b: GeoJSON.Position) {
  return a[0] === b[0] || a[1] === b[1];
}

// Closest point to `c` on segment a-b.
function closestOnSegment(a: ScreenPoint, b: ScreenPoint, c: ScreenPoint): ScreenPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / lenSq));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

// Keep text upright: fold the angle into [-90, 90].
function readableAngle(a: ScreenPoint, b: ScreenPoint) {
  let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return angle;
}

const distSq = (a: ScreenPoint, b: ScreenPoint) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * One label point per depth, with the screen angle of the line there.
 * Depths are placed shallow to deep; each takes the visible contour point nearest
 * the viewport centre that is at least MIN_LABEL_GAP from labels already placed.
 */
export function buildIsobathLabels(
  features: GeoJSON.Feature[],
  viewport: Viewport,
  depthKey = 'min_depth',
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const { width, height, project, unproject } = viewport;
  const center = { x: width / 2, y: height / 2 };
  const isVisible = (p: ScreenPoint) =>
    p.x >= EDGE_MARGIN &&
    p.x <= width - EDGE_MARGIN &&
    p.y >= EDGE_MARGIN &&
    p.y <= height - EDGE_MARGIN;

  const candidatesByDepth = new Map<number, Candidate[]>();
  const addCandidate = (depth: number, point: ScreenPoint, angle: number) => {
    if (!isVisible(point)) return;
    const list = candidatesByDepth.get(depth) ?? [];
    list.push({ distSq: distSq(point, center), point, angle });
    candidatesByDepth.set(depth, list);
  };

  for (const feature of features) {
    const depth = feature.properties?.[depthKey];
    if (typeof depth !== 'number' || !feature.geometry) continue;

    for (const ring of getRings(feature.geometry)) {
      for (let i = 0; i < ring.length - 1; i++) {
        if (isTileClipEdge(ring[i], ring[i + 1])) continue;
        const a = project(ring[i] as [number, number]);
        const b = project(ring[i + 1] as [number, number]);
        const angle = readableAngle(a, b);

        // The point nearest the centre, plus evenly spaced points as fallbacks.
        addCandidate(depth, closestOnSegment(a, b, center), angle);
        const steps = Math.floor(Math.sqrt(distSq(a, b)) / SAMPLE_STEP);
        for (let s = 0; s <= steps; s++) {
          const t = steps === 0 ? 0 : s / steps;
          addCandidate(depth, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }, angle);
        }
      }
    }
  }

  const placed: { depth: number; point: ScreenPoint; angle: number }[] = [];
  const minGapSq = MIN_LABEL_GAP ** 2;

  for (const depth of [...candidatesByDepth.keys()].sort((a, b) => a - b)) {
    const candidates = candidatesByDepth.get(depth)!.sort((a, b) => a.distSq - b.distSq);
    const spaced = candidates.find(c => placed.every(p => distSq(p.point, c.point) >= minGapSq));
    // No spaced spot: use the nearest and let Mapbox collision decide.
    const chosen = spaced ?? candidates[0];
    placed.push({ depth, point: chosen.point, angle: chosen.angle });
  }

  return {
    type: 'FeatureCollection',
    features: placed.map(({ depth, point, angle }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: unproject(point) },
      properties: { depth, angle: Math.round(angle * 10) / 10 },
    })),
  };
}
