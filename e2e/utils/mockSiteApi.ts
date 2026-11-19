import type { Page } from '@playwright/test';

type SiteMock = {
  name: string;
  coordinates: [number, number];
  // Shown in the "Latest Observations" panel, so tests can assert on it.
  latestValue: string;
};

// `reportedAt` is mid-day UTC, so it falls on the same calendar day in UTC and Sydney.
export const WAVE_BUOYS = {
  HOBARITO: {
    name: 'HOBARITO',
    coordinates: [147.33, -42.88] as [number, number],
    reportedAt: '2025-07-01T02:00:00Z',
    latestValue: '1.8', // wave height (m)
  },
  DARWIN: {
    name: 'DARWIN',
    coordinates: [130.78, -12.1] as [number, number],
    reportedAt: '2025-07-02T02:00:00Z',
    latestValue: '1.8',
  },
};

export const MOORING_SITE: SiteMock = {
  name: 'NRSKAI',
  coordinates: [151.8, -35.8],
  latestValue: '18.30', // temperature (°C), formatted to 2 dp
};
export const ESTUARINE_MOORING_SITE: SiteMock = {
  name: 'SWAN-01',
  coordinates: [115.8, -32.0],
  latestValue: '20.60',
};

// Two hourly [ms-timestamp, value] points on `date`; the last one is the latest reading.
function twoPointSeries(date: string, values: [number, number]): [number, number][] {
  const start = Date.parse(`${date}T00:00:00Z`);
  return [
    [start, values[0]],
    [start + 3_600_000, values[1]],
  ];
}

function detailsOf(site: Pick<SiteMock, 'coordinates'>, properties: object) {
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Point', coordinates: site.coordinates },
  };
}

function sitesOf(site: SiteMock, date: string) {
  return {
    type: 'FeatureCollection',
    metadata: {},
    features: [
      {
        type: 'Feature',
        properties: { date, site: site.name },
        geometry: { type: 'Point', coordinates: site.coordinates },
      },
    ],
  };
}

// Wave buoy sites reported within the `datetime` range (all of them when no range is sent).
function waveBuoySites(datetime: string | null) {
  const [from, to] = datetime?.split('/') ?? [];
  const inRange = (instant: string) =>
    !datetime || (Date.parse(instant) >= Date.parse(from) && Date.parse(instant) <= Date.parse(to));
  return {
    type: 'FeatureCollection',
    metadata: {},
    features: Object.values(WAVE_BUOYS)
      .filter(b => inRange(b.reportedAt))
      .map(b => ({
        type: 'Feature',
        properties: { date: b.reportedAt, site: b.name },
        geometry: { type: 'Point', coordinates: b.coordinates },
      })),
  };
}

// Mocks the site endpoints (wave buoys, moorings, estuarine).
export async function mockSiteApi(page: Page, date: string) {
  const time = `${date}T00:00:00.000000000Z`;

  await page.route(/\/items\/\w+_latest_available_date(?:\?|$)/, route =>
    route.fulfill({ json: { time } }),
  );

  await page.route(/\/items\/wave_buoys_between_dates(?:\?|$)/, route =>
    route.fulfill({
      json: waveBuoySites(new URL(route.request().url()).searchParams.get('datetime')),
    }),
  );

  await page.route(/\/items\/moorings_between_dates(?:\?|$)/, route =>
    route.fulfill({ json: sitesOf(MOORING_SITE, date) }),
  );

  await page.route(/\/items\/mooring_estuarine_water_quality_between_dates(?:\?|$)/, route =>
    route.fulfill({ json: sitesOf(ESTUARINE_MOORING_SITE, date) }),
  );

  // Details behind the chart drawer, opened by clicking a site.
  await page.route(/\/items\/wave_buoy_details_between_dates(?:\?|$)/, route => {
    const name = new URL(route.request().url()).searchParams.get('waveBuoy');
    const buoy = Object.values(WAVE_BUOYS).find(b => b.name === name) ?? WAVE_BUOYS.HOBARITO;
    return route.fulfill({
      json: detailsOf(buoy, {
        WSSH: twoPointSeries(date, [1.5, 1.8]),
        WPFM: twoPointSeries(date, [9.0, 9.5]),
        SSWMD: twoPointSeries(date, [260, 270]),
      }),
    });
  });

  await page.route(/\/items\/mooring_details_between_dates(?:\?|$)/, route =>
    route.fulfill({
      json: detailsOf(MOORING_SITE, {
        'NOMINAL_DEPTH_10.0': { TEMP: twoPointSeries(date, [18.1, 18.3]) },
      }),
    }),
  );

  await page.route(
    /\/items\/mooring_estuarine_water_quality_details_between_dates(?:\?|$)/,
    route =>
      route.fulfill({
        json: detailsOf(ESTUARINE_MOORING_SITE, {
          'instrument_EXO2-SONDE': {
            'NOMINAL_DEPTH_0.9': { TEMP: twoPointSeries(date, [20.4, 20.6]) },
          },
        }),
      }),
  );
}
