//TODO: This is not GeoJSON standard compliant, but it is used in the app.
export const locations = (): GeoJSON.FeatureCollection =>
  ({
    type: 'FeatureCollection',
    metadata: {
      date: '2025-01-02',
      buoy_count: 3,
      generated_at: '2025-07-10T11:33:38.697079',
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [151.3, -33.72],
        },
        properties: {
          date: '2025-01-01',
          buoy: 'COLLAROY',
          year: 2025,
          timestamp: '2025-01-01T00:10:00',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [115.64, -31.85],
        },
        properties: {
          date: '2025-01-01',
          buoy: 'HILLARYS',
          year: 2025,
          timestamp: '2025-01-01T00:25:00',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [150.0, -36.7],
        },
        properties: {
          date: '2025-01-01',
          buoy: 'TATHRA',
          year: 2025,
          timestamp: '2025-01-01T00:20:00',
        },
      },
    ],
  }) as GeoJSON.FeatureCollection;
//TODO: This is not GeoJSON standard compliant, but it is used in the app.

type Coordinates = [number, number];
type DataGenerators = {
  sswmd: (date: Date) => [number, number][];
  wpfm: (date: Date) => [number, number][];
  wssh: (date: Date) => [number, number][];
};

type Buoy = { coordinates: Coordinates; name: string; dataDate: Date };
const genData = (
  { coordinates, name, dataDate }: Buoy,
  { sswmd, wpfm, wssh }: DataGenerators,
): GeoJSON.FeatureCollection => {
  const [date] = dataDate.toISOString().split('T');
  const data = {
    type: 'FeatureCollection',
    metadata: {
      type: 'daily_hourly_timeseries',
      date,
      location: name,
      generated_at: '2025-07-10T11:43:23.707412',
      description: 'Hourly averaged wave data',
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: {
          SSWMD: {
            data: sswmd(dataDate),
          },

          WPFM: {
            data: wpfm(dataDate),
          },

          WSSH: {
            data: wssh(dataDate),
          },
        },
      },
    ],
  } as GeoJSON.FeatureCollection;

  return data;
};

const everyDayPeriodicity = (date: Date, nextValue: () => number): [number, number][] => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return [[date.getTime(), nextValue()]];
};

export const genBuoyData = (
  { name, dataDate }: Omit<Buoy, 'coordinates'>,
  dataGenerators: DataGenerators,
): GeoJSON.FeatureCollection =>
  genData({ dataDate, coordinates: [143.72338, -38.75365], name }, dataGenerators);

export const genBuoyRandomData = ({
  name,
  dataDate,
}: Omit<Buoy, 'coordinates'>): GeoJSON.FeatureCollection =>
  genData(
    { dataDate, coordinates: [143.72338, -38.75365], name },
    {
      sswmd: (date: Date) => {
        return everyDayPeriodicity(date, () => Math.random() * 360);
      },
      wpfm: (date: Date) => {
        return everyDayPeriodicity(date, () => Math.random() * 50);
      },
      wssh: (date: Date) => {
        return everyDayPeriodicity(date, () => Math.random() * 100);
      },
    },
  );
