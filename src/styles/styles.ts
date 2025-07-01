import terrain from './terrain.json';

type MapboxStyle = { title: 'Dark' | 'Streets' | 'Satellite'; source: string };
type CustomStyle = { title: 'Terrain'; source: typeof terrain };
export type Style = MapboxStyle | CustomStyle;

const mapboxStyles: MapboxStyle[] = [
  { title: 'Dark', source: 'mapbox://styles/mapbox/dark-v11' },
  { title: 'Streets', source: 'mapbox://styles/mapbox/streets-v12' },
  { title: 'Satellite', source: 'mapbox://styles/mapbox/satellite-v9' },
];

export const customStyles: CustomStyle[] = [{ title: 'Terrain', source: terrain }];

export const styles: Style[] = [...mapboxStyles, ...customStyles];

export type StyleTitle = 'Dark' | 'Streets' | 'Satellite' | 'Terrain';
export type StyleSource =
  | 'mapbox://styles/mapbox/dark-v11'
  | 'mapbox://styles/mapbox/streets-v12'
  | 'mapbox://styles/mapbox/satellite-v9'
  | typeof terrain;
