import type { MapMouseEvent } from 'mapbox-gl';
import { getFeatureInfoUrl } from './threddsUrl';
import type { OverlaySource } from '@/constants';
import { GSLA_OVERLAY_SOURCE_ID, SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID, PRODUCT } from '@/constants';

/**
 * Parses XML response from WMS GetFeatureInfo request
 * @param xmlString - The XML response string
 * @returns The numeric value from the first FeatureInfo element, or null if not found
 */
function parseFeatureInfoXML(xmlString: string): number | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return null;
    }

    const valueElement = xmlDoc.querySelector('FeatureInfoResponse FeatureInfo value');
    if (!valueElement?.textContent) {
      return null;
    }

    const value = Number(valueElement.textContent);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.error('Error parsing feature info XML:', error);
    return null;
  }
}

type OverlaySourceData = {
  [GSLA_OVERLAY_SOURCE_ID]: {
    [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: { gsla: number };
  };
  [SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID]: {
    [PRODUCT.SST_ANOMALY_MOSAIC]: { sstAnom: number };
  };
};

/**
 * Fetches overlay data (GSLA or SST Anomaly) from THREDDS WMS service
 */
const fetchOverlayData =
  <T extends OverlaySource>(overlaySource: T) =>
  async (
    date: string,
    mapBounds: [number, number, number, number],
    mapSize: { width: number; height: number },
    point: MapMouseEvent['point'],
  ): Promise<Partial<OverlaySourceData[T]>> => {
    try {
      const url = await getFeatureInfoUrl(overlaySource, new Date(date), mapBounds, mapSize, point);

      const response = await fetch(url);

      const xmlString = await response.text();
      const value = parseFeatureInfoXML(xmlString);

      if (value === null) {
        return {};
      }

      // Map the value to the appropriate Product field based on overlay source
      if (overlaySource === GSLA_OVERLAY_SOURCE_ID) {
        return {
          [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: { gsla: value },
        } as OverlaySourceData[T];
      } else if (overlaySource === SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID) {
        return {
          [PRODUCT.SST_ANOMALY_MOSAIC]: { sstAnom: value },
        } as OverlaySourceData[T];
      }

      return {};
    } catch (error) {
      console.error('Error fetching overlay data:', error);
      throw error; // let react query catch and handle error.
    }
  };

export const fetchGslaAnomalySeaLevelsData = fetchOverlayData(GSLA_OVERLAY_SOURCE_ID);
export const fetchSstAnomalyMosaic = fetchOverlayData(SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID);

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
