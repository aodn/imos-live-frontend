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
          date,
          location: name,
          time_range: {
            start: `${date}T00:15:00.000000000`,
            end: `${date}T23:15:00.000000000`,
          },
          SSWMD: {
            name: 'SSWMD',
            standard_name: 'sea_surface_wave_from_direction',
            long_name: 'spectral sea surface wave mean direction',
            units: 'Degrees',
            positive: 'clockwise',
            reference_datum: 'true north',
            valid_min: 0.0,
            valid_max: 360.0,
            data: sswmd(dataDate),
            ancillary_variable: null,
            compass_correction_applied: '13',
          },

          WPFM: {
            name: 'WPFM',
            standard_name:
              'sea_surface_wave_mean_period_from_variance_spectral_density_first_frequency_moment',
            long_name: 'sea surface wave spectral mean period',
            units: 's',
            positive: null,
            reference_datum: null,
            valid_min: 0.0,
            valid_max: 50.0,
            data: wpfm(dataDate),
            ancillary_variable: null,
            compass_correction_applied: null,
          },

          WSSH: {
            name: 'WSSH',
            standard_name: 'sea_surface_wave_significant_height',
            long_name: 'sea surface wave spectral significant height',
            units: 'm',
            positive: null,
            reference_datum: null,
            valid_min: 0.0,
            valid_max: 100.0,
            data: wssh(dataDate),
            ancillary_variable: null,
            compass_correction_applied: null,
          },
        },
      },
    ],
  } as GeoJSON.FeatureCollection;

  return data;
};

const everyHourPeriodicity = (date: Date, nextValue: () => number): [number, number][] => {
  return Array.from({ length: 24 }, (_, i) => {
    const dateTime = new Date(date);
    dateTime.setHours(i, 0, 0, 0);
    return [dateTime.getTime(), nextValue()];
  });
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
        return everyHourPeriodicity(date, () => Math.random() * 360);
      },
      wpfm: (date: Date) => {
        return everyHourPeriodicity(date, () => Math.random() * 50);
      },
      wssh: (date: Date) => {
        return everyHourPeriodicity(date, () => Math.random() * 100);
      },
    },
  );
