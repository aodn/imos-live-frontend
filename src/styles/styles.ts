import terrain from './terrain.json';

type Style = {
  title: StyleTitle;
  source: StyleSource;
};

export type StyleTitle = 'Dark' | 'Streets' | 'Satellite' | 'Terrain';
export type StyleSource =
  | 'mapbox://styles/mapbox/dark-v11'
  | 'mapbox://styles/mapbox/streets-v12'
  | 'mapbox://styles/mapbox/satellite-v9'
  | typeof terrain;

const mapboxStyles: Style[] = [
  { title: 'Dark', source: 'mapbox://styles/mapbox/dark-v11' },
  { title: 'Streets', source: 'mapbox://styles/mapbox/streets-v12' },
  { title: 'Satellite', source: 'mapbox://styles/mapbox/satellite-v9' },
];

export const customStyles: Style[] = [{ title: 'Terrain', source: terrain }];

export const styles: Style[] = [...mapboxStyles, ...customStyles];
