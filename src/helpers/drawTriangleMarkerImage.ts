// Image size and triangle points, in CSS pixels. Padding leaves room for the outline.
const SIZE = 36;
const CENTER = SIZE / 2;
const VERTICES: [number, number][] = [
  [CENTER, CENTER - 12], // top
  [CENTER + 10.4, CENTER + 6], // bottom-right
  [CENTER - 10.4, CENTER + 6], // bottom-left
];

// Mapbox SDF format: edge at alpha 192, 32 alpha per pixel of distance.
const SDF_EDGE = 192;
const SDF_PER_PX = 32;

function distanceToSegment(
  px: number,
  py: number,
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function isInsideTriangle(px: number, py: number) {
  const signs = VERTICES.map(([ax, ay], i) => {
    const [bx, by] = VERTICES[(i + 1) % VERTICES.length];
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  });
  return signs.every(s => s >= 0) || signs.every(s => s <= 0);
}

/**
 * Draws the triangle marker image (SDF, so layers can colour and outline it).
 * useMapImages registers it to Mapbox; symbol layers use it via `icon-image`.
 */
export function drawTriangleMarkerImage() {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const edgeDistance = Math.min(
        ...VERTICES.map((v, i) =>
          distanceToSegment(px, py, v, VERTICES[(i + 1) % VERTICES.length]),
        ),
      );
      const signedDistance = isInsideTriangle(px, py) ? -edgeDistance : edgeDistance;
      const alpha = Math.max(0, Math.min(255, Math.round(SDF_EDGE - signedDistance * SDF_PER_PX)));
      const offset = (y * SIZE + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = alpha;
    }
  }
  return { width: SIZE, height: SIZE, data };
}
