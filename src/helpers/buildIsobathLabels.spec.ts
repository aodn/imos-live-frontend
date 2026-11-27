import { describe, expect, it } from 'vitest';
import { buildIsobathLabels } from './buildIsobathLabels';

// Identity projection: lng/lat are screen pixels.
const viewport = {
  width: 200,
  height: 200,
  project: ([x, y]: [number, number]) => ({ x, y }),
  unproject: ({ x, y }: { x: number; y: number }) => [x, y] as [number, number],
};

function line(depth: number, coordinates: [number, number][]): GeoJSON.Feature {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: { min_depth: depth },
  };
}

describe('buildIsobathLabels', () => {
  it('places one label per depth at the point nearest the centre', () => {
    const result = buildIsobathLabels(
      [
        line(200, [
          [40, 50.5],
          [160, 50.4],
        ]),
        line(200, [
          [40, 90.1],
          [160, 90.2],
        ]),
        line(1000, [
          [40, 150.3],
          [160, 150.2],
        ]),
      ],
      viewport,
    );

    expect(result.features).toHaveLength(2);
    expect(result.features[0].properties).toMatchObject({ depth: 200 });
    expect(result.features[0].geometry.coordinates[1]).toBeCloseTo(90.15, 1);
    expect(result.features[1].properties).toMatchObject({ depth: 1000 });
  });

  it('spreads labels of close lines apart', () => {
    const wide = { ...viewport, width: 400 };
    const result = buildIsobathLabels(
      [
        line(200, [
          [40, 100.1],
          [360, 100.2],
        ]),
        line(600, [
          [40, 110.3],
          [360, 110.4],
        ]),
      ],
      wide,
    );

    const [a, b] = result.features.map(f => f.geometry.coordinates);
    expect(a[0]).toBeCloseTo(200, 0);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThanOrEqual(100);
  });

  it('keeps text upright for right-to-left lines', () => {
    const result = buildIsobathLabels(
      [
        line(200, [
          [160, 100.5],
          [40, 99.5],
        ]),
      ],
      viewport,
    );
    expect(Math.abs(result.features[0].properties!.angle)).toBeLessThan(90);
  });

  it('ignores tile clip edges and off-screen points', () => {
    const result = buildIsobathLabels(
      [
        line(200, [
          [100, 0],
          [100, 200],
        ]), // constant lng: tile clip edge
        line(1000, [
          [0, 5],
          [200, 6],
        ]), // inside the edge margin
      ],
      viewport,
    );
    expect(result.features).toHaveLength(0);
  });
});
