import {
  OverlaySource,
  GSLA_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
} from '@/constants';

const baseUrl = (id: OverlaySource, date: Date): string => {
  return {
    [GSLA_OVERLAY_SOURCE_ID]: (date: Date) =>
      `/thredds/wms/IMOS/OceanCurrent/GSLA/NRT/${date.getFullYear()}/IMOS_OceanCurrent_HV_${date.getFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}T000000Z_GSLA_FV02_NRT.nc`,
    [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: (date: Date) =>
      `/thredds/wms/AusTemp/${date.getFullYear()}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc`,
  }[id](date);
};

export const rasterUrl = (id: OverlaySource, date: Date): string => {
  return {
    [GSLA_OVERLAY_SOURCE_ID]: (date: Date) =>
      `${baseUrl(id, date)}?bbox={bbox-epsg-3857}&COLORSCALERANGE=-1.2,1.2&version=1.3.0&REQUEST=GetMap&LAYERS=GSLA&styles=raster/x-Rainbow&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`,
    [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: (date: Date) =>
      `${baseUrl(id, date)}?bbox={bbox-epsg-3857}&version=1.3.0&COLORSCALERANGE=-10,5&REQUEST=GetMap&LAYERS=sst_anom_mosaic&styles=raster/div-RdYlBu-inv&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`,
  }[id](date);
};

export const rasterLegendUrl = (id: OverlaySource, date: Date): string => {
  return {
    [GSLA_OVERLAY_SOURCE_ID]: (date: Date) =>
      `${baseUrl(id, date)}?version=1.3.0&COLORSCALERANGE=-1.2,1.2&REQUEST=GetLegendGraphic&palette=x-Rainbow&COLORBARONLY=true&VERTICAL=false&WIDTH=443&HEIGHT=12`,
    [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: (date: Date) =>
      `${baseUrl(id, date)}?version=1.3.0&COLORSCALERANGE=-10,5&REQUEST=GetLegendGraphic&palette=div-RdYlBu-inv&COLORBARONLY=true&VERTICAL=false&WIDTH=443&HEIGHT=12`,
  }[id](date);
};

export const getFeatureInfoUrl = (
  id: OverlaySource,
  date: Date,
  mapBounds: [number, number, number, number], // [west, south, east, north]
  mapSize: { width: number; height: number },
  clickPoint: { x: number; y: number },
): string => {
  const base = baseUrl(id, date);
  const layerName = {
    [GSLA_OVERLAY_SOURCE_ID]: 'GSLA',
    [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: 'sst_anom_mosaic',
  }[id];

  // WMS 1.3.0 uses EPSG:4326 (lat,lon order for this CRS)
  const [west, south, east, north] = mapBounds;
  const bbox = `${south},${west},${north},${east}`;

  return `${base}?REQUEST=GetFeatureInfo&SERVICE=WMS&VERSION=1.3.0&LAYERS=${layerName}&QUERY_LAYERS=${layerName}&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=${mapSize.width}&HEIGHT=${mapSize.height}&I=${Math.floor(clickPoint.x)}&J=${Math.floor(clickPoint.y)}&INFO_FORMAT=text/xml`;
};
