import terrain from "./terrain.json";

const mapboxStyles = [
  { title: "Dark", source: "mapbox://styles/mapbox/dark-v11" },
  { title: "Streets", source: "mapbox://styles/mapbox/streets-v12" },
  { title: "Satellite", source: "mapbox://styles/mapbox/satellite-v9" },
];

export const customStyles = [{ title: "Terrain", source: terrain }];

export const styles = mapboxStyles.concat(customStyles);

export const stylesList = [...customStyles, ...mapboxStyles] as const;
export type StyleTitle = (typeof stylesList)[number]["title"];
