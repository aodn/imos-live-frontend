import {
  GSLA_OVERLAY_SOURCE_ID,
  OVERLAY_LAYER_ID,
  OverlaySource,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
} from '@/constants';

const rasterUrl = (id: OverlaySource, date: Date): string => {
  return {
    [GSLA_OVERLAY_SOURCE_ID]: (date: Date) =>
      `/thredds/wms/IMOS/OceanCurrent/GSLA/NRT/${date.getFullYear()}/IMOS_OceanCurrent_HV_${date.getFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T000000Z_GSLA_FV02_NRT.nc?bbox={bbox-epsg-3857}&COLORSCALERANGE=-0.5,0.5&version=1.3.0&REQUEST=GetMap&LAYERS=GSLA&styles=raster/seq-Heat&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`,
    [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: (date: Date) =>
      `/thredds/wms/IMOS/SRS/AusTemp/ssta/${date.getFullYear()}/${date.getFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc?bbox={bbox-epsg-3857}&version=1.3.0&COLORSCALERANGE=0,40.5&REQUEST=GetMap&LAYERS=sst_anom_mosaic&styles=raster/div-RdYlBu-inv&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`,
  }[id](date);
};

export function addOrUpdateWMSSource(
  map: mapboxgl.Map,
  overlaySource: OverlaySource,
  dataset: string,
) {
  const date = new Date(dataset);
  const url = rasterUrl(overlaySource, date);
  const source = map.getSource(OVERLAY_LAYER_ID);
  if (source && source.type === 'raster') {
    source.setTiles([url]);
    return;
  }
  map.addSource(OVERLAY_LAYER_ID, {
    type: 'raster',
    tiles: [url],
    tileSize: 256,
  });
}
