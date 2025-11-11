import ESRIWorldImagery from './ESRIWorldImagery.json';

type MapboxStyle = { title: 'Dark' | 'Streets' | 'Satellite'; source: string };
type ESRIWorldImageryStyle = { title: 'ESRIWorldImagery'; source: typeof ESRIWorldImagery };

export type Style = MapboxStyle | ESRIWorldImageryStyle;

const mapboxStyles: MapboxStyle[] = [
  { title: 'Dark', source: 'mapbox://styles/mapbox/dark-v11' },
  { title: 'Streets', source: 'mapbox://styles/mapbox/streets-v12' },
  { title: 'Satellite', source: 'mapbox://styles/mapbox/satellite-v9' },
];

export const customStyles: ESRIWorldImageryStyle[] = [
  { title: 'ESRIWorldImagery', source: ESRIWorldImagery },
];

export const styles: Style[] = [...mapboxStyles, ...customStyles];

export type StyleTitle = 'Dark' | 'Streets' | 'Satellite' | 'ESRIWorldImagery';
export type StyleSource =
  | 'mapbox://styles/mapbox/dark-v11'
  | 'mapbox://styles/mapbox/streets-v12'
  | 'mapbox://styles/mapbox/satellite-v9'
  | typeof ESRIWorldImagery;

export const worldLandStyle = {
  title: 'countryBoundaries',
  source: 'mapbox://mapbox.country-boundaries-v1',
};
