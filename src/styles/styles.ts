import terrain from './terrain.json';
import ESRIWorldImagery from './ESRIWorldImagery.json';

type MapboxStyle = { title: 'Dark' | 'Streets' | 'Satellite'; source: string };
type TerrianStyle = { title: 'Terrain'; source: typeof terrain };
type ESRIWorldImageryStyle = { title: 'ESRIWorldImagery'; source: typeof ESRIWorldImagery };

export type Style = MapboxStyle | TerrianStyle | ESRIWorldImageryStyle;

const mapboxStyles: MapboxStyle[] = [
  { title: 'Dark', source: 'mapbox://styles/mapbox/dark-v11' },
  { title: 'Streets', source: 'mapbox://styles/mapbox/streets-v12' },
  { title: 'Satellite', source: 'mapbox://styles/mapbox/satellite-v9' },
];

export const customStyles: (TerrianStyle | ESRIWorldImageryStyle)[] = [
  { title: 'Terrain', source: terrain },
  { title: 'ESRIWorldImagery', source: ESRIWorldImagery },
];

export const styles: Style[] = [...mapboxStyles, ...customStyles];

export type StyleTitle = 'Dark' | 'Streets' | 'Satellite' | 'Terrain' | 'ESRIWorldImagery';
export type StyleSource =
  | 'mapbox://styles/mapbox/dark-v11'
  | 'mapbox://styles/mapbox/streets-v12'
  | 'mapbox://styles/mapbox/satellite-v9'
  | typeof terrain
  | typeof ESRIWorldImagery;
