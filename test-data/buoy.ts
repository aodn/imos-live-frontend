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

type Coordinates = [number, number];
type DataGenerators = {
  sswmd: (date: Date) => [number, number][];
  wpfm: (date: Date) => [number, number][];
  wssh: (date: Date) => [number, number][];
};

type Buoy = { coordinates: Coordinates; name: string; dataDate: Date };
const genData = (
  { coordinates, name, dataDate }: Partial<Buoy>,
  { sswmd, wpfm, wssh }: DataGenerators,
): GeoJSON.FeatureCollection => {
  const [date] = dataDate?.toISOString().split('T') || [];
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
          SSWMD: sswmd(new Date(dataDate || '')),
          WPFM: wpfm(new Date(dataDate || '')),
          WSSH: wssh(new Date(dataDate || '')),
        },
      },
    ],
  } as GeoJSON.FeatureCollection;

  return data;
};

export const genBuoyData = (
  { name, dataDate }: Omit<Buoy, 'coordinates'>,
  dataGenerators: DataGenerators,
): GeoJSON.FeatureCollection =>
  genData({ dataDate, coordinates: [143.72338, -38.75365], name }, dataGenerators);

export const genBuoyRandomData = ({
  from,
  to,
}: {
  name: string;
  from: Date;
  to: Date;
}): GeoJSON.Feature => {
  const properties = {
    SSWMD: [] as [number, number][],
    WPFM: [] as [number, number][],
    WSSH: [] as [number, number][],
  };
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    properties['SSWMD'].push([current.getTime(), Math.random() * 360]);
    properties['WPFM'].push([current.getTime(), Math.random() * 50]);
    properties['WSSH'].push([current.getTime(), Math.random() * 100]);
    current.setDate(current.getDate() + 1);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [143.72338, -38.75365],
    },
    properties,
  };
};
