import { PRODUCT, extractProductVariables } from '@/constants';
import type { Page, Route } from '@playwright/test';
import {
  DEEP_LINK_DAY,
  DEFAULT_DAY,
  GSLA_ANOMALY_PRODUCT,
  GSLA_PARTICLE_PRODUCT,
  NEXT_DAY,
} from './constants';

// Minimal single-LOD manifests: one 256×256 tile over the Australasian bounds.
// Tile PNGs are aborted, so layers end up in error state, which is enough for
// layer registration and popup data-flow tests.
const BOUNDS = { lonMin: 109.9, lonMax: 170.1, latMin: -50.1, latMax: 0.1 };
const LODS = { '1': { grid: [1, 1], storedPx: [256, 256], chunkPx: [256, 256], padding: 0 } };

const PARTICLE_MANIFEST = { bounds: BOUNDS, uRange: [-1, 1], vRange: [-1, 1], lods: LODS };
const SCALAR_MANIFEST = { bounds: BOUNDS, valueRange: [-1.2, 1.2], lods: LODS };

// Top-level metadata manifest (`/products`). Layer hooks gate their first tile load on
// it and validate the selected date against `available_dates`.
// The latest date (deep-link day) must differ from NEXT_DAY: `useProductLabels`
// pre-caches the latest date's manifest, which would hide the day-change request
// the tests wait for.
const AVAILABLE_DATES = [DEFAULT_DAY, NEXT_DAY, DEEP_LINK_DAY];
const METADATA_MANIFEST = {
  products: (
    [
      GSLA_PARTICLE_PRODUCT,
      GSLA_ANOMALY_PRODUCT,
      PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
      PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
      PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC,
    ] as const
  ).map(id => ({
    id,
    available_dates: AVAILABLE_DATES,
    full_date_range: { start: AVAILABLE_DATES[0], end: AVAILABLE_DATES.at(-1)! },
  })),
};

// u=N, v=0 gives a due-east vector with speed N and Cartesian degree 0.
function particlePointForDate(date: string) {
  const speed = date === DEFAULT_DAY ? 1 : 2;
  return {
    lat: -30,
    lon: 150,
    variables: {
      UCUR: { value: speed, units: 'm/s' },
      VCUR: { value: 0, units: 'm/s' },
    },
  };
}

function gslaPointForDate(date: string) {
  const value = date === DEFAULT_DAY ? 3 : 4;
  return { lat: -30, lon: 150, variables: { GSLA: { value, units: 'm' } } };
}

// Mocks the tiles endpoints: products metadata, per-date manifest, tiles and point lookup.
export async function mockTilesApi(page: Page) {
  const { variable: particleVariable } = extractProductVariables(GSLA_PARTICLE_PRODUCT);
  const { variable: anomalyVariable } = extractProductVariables(GSLA_ANOMALY_PRODUCT);

  // `/collections/{collectionId}/products`
  await page.route(/\/collections\/[^/]+\/products(?:$|\?)/, route =>
    route.fulfill({ json: METADATA_MANIFEST }),
  );

  // `/data_tiles/manifest?dataset=...&variable=...&datetime=...`, routed by `variable`.
  await page.route(/\/data_tiles\/manifest(?:\?|$)/, async (route: Route) => {
    const url = new URL(route.request().url());
    const isParticle = url.searchParams.get('variable') === particleVariable;
    await route.fulfill({ json: isParticle ? PARTICLE_MANIFEST : SCALAR_MANIFEST });
  });

  // `/data_tiles/{lod}/{cx}/{cy}?...`: abort so layers fall into error state quickly.
  await page.route(/\/data_tiles\/\d+\/\d+\/\d+(?:\?|$)/, route => route.abort());

  // Per-point lookup behind the click popup, routed by `variable`.
  await page.route(/\/data_tiles\/point(?:\?|$)/, async (route: Route) => {
    const url = new URL(route.request().url());
    const date = url.searchParams.get('datetime') ?? DEFAULT_DAY;
    const variable = url.searchParams.get('variable');
    if (variable === particleVariable) {
      await route.fulfill({ json: particlePointForDate(date) });
    } else if (variable === anomalyVariable) {
      await route.fulfill({ json: gslaPointForDate(date) });
    } else {
      await route.fulfill({ json: { lat: -30, lon: 150, variables: {} } });
    }
  });
}
