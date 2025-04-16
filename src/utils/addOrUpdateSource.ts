type RangeType = [number, number];

type CoordinatesType = [
  range: RangeType,
  range: RangeType,
  range: RangeType,
  range: RangeType,
];

export const addOrUpdateSource = (
  map: mapboxgl.Map,
  id: string,
  url: string,
  lonRange: RangeType,
  latRange: RangeType,
) => {
  const source = map.getSource(id) as mapboxgl.ImageSource | undefined;

  const coordinates: CoordinatesType = [
    [lonRange[0], latRange[1]],
    [lonRange[1], latRange[1]],
    [lonRange[1], latRange[0]],
    [lonRange[0], latRange[0]],
  ];

  if (source) {
    source.updateImage({ url, coordinates });
  } else {
    map.addSource(id, { type: "image", url, coordinates });
  }
};
