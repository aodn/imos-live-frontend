export function gerMapMetaData(map: React.RefObject<mapboxgl.Map | null>) {
  if (!map.current) return {};

  const bounds = map.current.getBounds();
  const mapBounds: [number, number, number, number] | undefined = bounds
    ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    : undefined;
  const mapSize = {
    width: map.current.getCanvas().width,
    height: map.current.getCanvas().height,
  };

  return {
    mapBounds,
    mapSize,
  };
}
