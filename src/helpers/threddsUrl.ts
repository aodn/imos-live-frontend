import type { OverlaySource } from '@/constants';
import { GSLA_OVERLAY_SOURCE_ID, SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID } from '@/constants';
import { getThreddsCatalog } from '@/api';
import { addYears } from '@/utils';

const FALLBACK_URL = 'http://www.example.com';

const THREDDS_PATHS = {
  GSLA: 'IMOS/OceanCurrent/GSLA/NRT',
  SST: 'IMOS/SRS/AusTemp/ssta',
} as const;

const FILE_PATTERNS = {
  GSLA: (dateString: string) => `IMOS_OceanCurrent_HV_${dateString}T`,
  SST: (dateString: string) => `${dateString}_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc`,
} as const;

const LAYER_NAMES = {
  [GSLA_OVERLAY_SOURCE_ID]: 'GSLA',
  [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: 'sst_anom_mosaic',
} as const;

const WMS_CONFIG = {
  [GSLA_OVERLAY_SOURCE_ID]: {
    layers: 'GSLA',
    colorScaleRange: '-1.2,1.2',
    styles: 'raster/x-Rainbow',
    legendPalette: 'x-Rainbow',
  },
  [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: {
    layers: 'sst_anom_mosaic',
    colorScaleRange: '-10,5',
    styles: 'raster/div-RdYlBu-inv',
    legendPalette: 'div-RdYlBu-inv',
  },
} as const;

const generateFileDateString = (date: Date): string => {
  return `${date.getFullYear()}${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
};

const generateDoc = async (path: string, date: Date) => {
  const catalog = await getThreddsCatalog(path, date);
  const parser = new DOMParser();
  return parser.parseFromString(catalog, 'text/html');
};

const findLinkInCatalog = (doc: Document, pattern: string): string | null => {
  return (
    Array.from(doc.querySelectorAll('.section-content a[href]'))
      .map(item => (item as HTMLAnchorElement).href)
      .find(link => link.includes(pattern)) || null
  );
};

// GSLA file name pattern example: IMOS_OceanCurrent_HV_20240615T000000Z_NRT.nc or IMOS_OceanCurrent_HV_20240615T180000Z_DAILY.nc,
// so we just need date part to find the link in catalog. and certain year file is expected to be in certain year folder in thredds server.
// Therefore, we can always find certain year's GSLA file in that year's folder catalog.
const getGslaUrlFromCatalog = async (date: Date): Promise<string> => {
  let link = FALLBACK_URL;
  try {
    const doc = await generateDoc(THREDDS_PATHS.GSLA, date);
    const dateString = generateFileDateString(date);
    link = findLinkInCatalog(doc, FILE_PATTERNS.GSLA(dateString)) || link;
  } catch (error) {
    console.error('Error fetching GSLA catalog:', error);
  }
  const url = new URL(link);
  return `/thredds/wms/${url.searchParams.get('dataset')}`;
};

// SST file name pattern example: 20240615_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc, but the file may be in next year folder.
const getSstUrlFromCatalog = async (date: Date): Promise<string> => {
  const dateString = generateFileDateString(date);
  const pattern = FILE_PATTERNS.SST(dateString);

  const dates = [date, addYears(date, 1)];
  for (const searchDate of dates) {
    try {
      const doc = await generateDoc(THREDDS_PATHS.SST, searchDate);
      const foundLink = findLinkInCatalog(doc, pattern);
      if (foundLink) {
        const url = new URL(foundLink);
        return `/thredds/wms/${url.searchParams.get('dataset')}`;
      }
    } catch (error) {
      console.error('Error fetching SST catalog:', error);
    }
  }

  const url = new URL(FALLBACK_URL);
  return `/thredds/wms/${url.searchParams.get('dataset')}`; //do not throw error here to avoid image loading failure test for legend url
};

const baseUrl = async (id: OverlaySource, date: Date): Promise<string> => {
  switch (id) {
    case GSLA_OVERLAY_SOURCE_ID:
      return await getGslaUrlFromCatalog(date);
    case SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID:
      return await getSstUrlFromCatalog(date);
    default:
      throw new Error(`Unknown overlay source: ${id}`);
  }
};

export const rasterUrl = async (id: OverlaySource, date: Date): Promise<string> => {
  const base = await baseUrl(id, date);
  const config = WMS_CONFIG[id];
  // Use /tiles/{z}/{x}/{y} path for CloudFront cache-friendly URLs
  // The proxy will convert z/x/y to bbox before forwarding to THREDDS
  return `/tiles/{z}/{x}/{y}${base}?COLORSCALERANGE=${config.colorScaleRange}&version=1.3.0&REQUEST=GetMap&LAYERS=${config.layers}&styles=${config.styles}&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`;
};

export const rasterLegendUrl = async (id: OverlaySource, date: Date): Promise<string> => {
  const base = await baseUrl(id, date);
  const config = WMS_CONFIG[id];

  return `${base}?version=1.3.0&COLORSCALERANGE=${config.colorScaleRange}&REQUEST=GetLegendGraphic&palette=${config.legendPalette}&COLORBARONLY=true&VERTICAL=false&WIDTH=443&HEIGHT=12`;
};

export const getFeatureInfoUrl = async (
  id: OverlaySource,
  date: Date,
  mapBounds: [number, number, number, number], // [west, south, east, north]
  mapSize: { width: number; height: number },
  clickPoint: { x: number; y: number },
): Promise<string> => {
  const base = await baseUrl(id, date);
  const layerName = LAYER_NAMES[id];

  // WMS 1.3.0 uses EPSG:4326 (lat,lon order for this CRS)
  const [west, south, east, north] = mapBounds;
  const bbox = `${south},${west},${north},${east}`;

  return `${base}?REQUEST=GetFeatureInfo&SERVICE=WMS&VERSION=1.3.0&LAYERS=${layerName}&QUERY_LAYERS=${layerName}&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=${mapSize.width}&HEIGHT=${mapSize.height}&I=${Math.floor(clickPoint.x)}&J=${Math.floor(clickPoint.y)}&INFO_FORMAT=text/xml`;
};
