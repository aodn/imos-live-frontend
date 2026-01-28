import ESRIWorldImagery from './ESRIWorldImagery.json';
import SteetWithBathymetry from './StreetWithBathymetry.json';

type MapboxStyle = { title: 'Dark' | 'Streets' | 'Satellite'; source: string };
type ESRIWorldImageryStyle = { title: 'ESRIWorldImagery'; source: typeof ESRIWorldImagery };
type StreetWithBathymetryStyle = { title: 'Streets'; source: typeof SteetWithBathymetry };

export type Style = MapboxStyle | ESRIWorldImageryStyle | StreetWithBathymetryStyle;

const mapboxStyles: MapboxStyle[] = [{ title: 'Dark', source: 'mapbox://styles/mapbox/dark-v11' }];

export const customStyles: (ESRIWorldImageryStyle | StreetWithBathymetryStyle)[] = [
  { title: 'ESRIWorldImagery', source: ESRIWorldImagery },
  { title: 'Streets', source: SteetWithBathymetry },
];

export const styles: Style[] = [...mapboxStyles, ...customStyles];

export type StyleTitle = 'Dark' | 'Streets' | 'ESRIWorldImagery';
export type StyleSource =
  | 'mapbox://styles/mapbox/dark-v11'
  | typeof ESRIWorldImagery
  | typeof SteetWithBathymetry;

export const worldLandStyle = {
  title: 'countryBoundaries',
  source: 'mapbox://mapbox.country-boundaries-v1',
};
