import { describe, expect, it } from 'vitest';
import type { Feature, LineString, Point } from 'geojson';
import { addIdToFeatures } from './addIdToFeatures';

function pointFeature(
  coords: [number, number],
  properties: GeoJSON.GeoJsonProperties = {},
): Feature<Point> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: coords },
    properties,
  };
}

describe('addIdToFeatures', () => {
  it('assigns _id and feature.id based on rounded coordinates + index', () => {
    const features: Feature[] = [pointFeature([150.123456, -30.123456])];
    addIdToFeatures(features);
    expect(features[0].properties!._id).toBe('150.12--30.12-0');
    expect(features[0].id).toBe('150.12--30.12-0');
  });

  it('produces distinct ids for duplicate coordinates via the index', () => {
    const features: Feature[] = [pointFeature([150, -30]), pointFeature([150, -30])];
    addIdToFeatures(features);
    expect(features[0].id).not.toBe(features[1].id);
  });

  it('skips non-Point geometries', () => {
    const lineFeature: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      },
      properties: {},
    };
    addIdToFeatures([lineFeature]);
    expect(lineFeature.id).toBeUndefined();
  });

  it('creates a properties object when one is missing', () => {
    const features: Feature[] = [pointFeature([1, 2], null)];
    addIdToFeatures(features);
    expect(features[0].properties).toBeDefined();
    expect(features[0].properties!._id).toBe('1.00-2.00-0');
  });
});
