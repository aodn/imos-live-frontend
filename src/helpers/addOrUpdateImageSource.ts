type RangeType = [number, number];

type CoordinatesType = [range: RangeType, range: RangeType, range: RangeType, range: RangeType];

export async function addOrUpdateImageSource(
  map: mapboxgl.Map,
  id: string,
  url: string,
  lonRange: RangeType,
  latRange: RangeType,
): Promise<void> {
  const source = map.getSource(id);

  const coordinates: CoordinatesType = [
    [lonRange[0], latRange[1]],
    [lonRange[1], latRange[1]],
    [lonRange[1], latRange[0]],
    [lonRange[0], latRange[0]],
  ];

  if (source && source.type == 'image') {
    source.updateImage({ url, coordinates });
  } else {
    map.addSource(id, { type: 'image', url, coordinates });
  }

  return new Promise(resolve => {
    const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
      if (e.sourceId === id && e.isSourceLoaded) {
        map.off('sourcedata', onSourceData);
        resolve();
      }
    };

    map.on('sourcedata', onSourceData);
  });
}
