export function addOrUpdateWaveBuoyWMSSource(map: mapboxgl.Map, id: string, dataset: string) {
  const date = new Date(dataset);
  const url = `/thredds/wms/IMOS/OceanCurrent/GSLA/NRT/${date.getFullYear()}/IMOS_OceanCurrent_HV_${date.getFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T000000Z_GSLA_FV02_NRT.nc?bbox={bbox-epsg-3857}&COLORSCALERANGE=-0.5,0.5&version=1.3.0&REQUEST=GetMap&LAYERS=GSLA&styles=raster/seq-Heat&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`;
  const source = map.getSource(id);
  if (source && source.type === 'raster') {
    source.setTiles([url]);
    return;
  }
  map.addSource(id, {
    type: 'raster',
    tiles: [url],
    tileSize: 256,
  });
}
