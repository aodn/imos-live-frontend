import { LngLat, MapMouseEvent, Point } from 'mapbox-gl';
import { getFeatureInfoUrl } from './threddsUrl';
import {
  OverlaySource,
  GSLA_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  Product,
} from '@/constants';
import { processOceanCurrentDetails } from '@/utils';
import { OceanCurrentDataResponse } from '@/api';
import { batchUpdateMapPopup, PopupStoreState, useMapPopupStore, useMapUIStore } from '@/store';

type GetPopupDataArg = {
  lngLat?: LngLat;
  oceanCurrentData: OceanCurrentDataResponse | undefined;
  overlay: boolean;
  particles: boolean;
  overlaySource: OverlaySource;
  dataset: string;
  mapBounds?: [number, number, number, number];
  mapSize?: {
    width: number;
    height: number;
  };
  point?: Point;
};

export type PopupData = PopupStoreState;

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

/**
 * Fetches overlay data (GSLA or SST Anomaly) from THREDDS WMS service
 */
async function fetchOverlayData(
  overlaySource: OverlaySource,
  dataset: string,
  mapBounds: [number, number, number, number],
  mapSize: { width: number; height: number },
  point: MapMouseEvent['point'],
): Promise<Partial<PopupData>> {
  try {
    const url = await getFeatureInfoUrl(
      overlaySource,
      new Date(dataset),
      mapBounds,
      mapSize,
      point,
    );

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch overlay data: ${response.status} ${response.statusText}`);
      return {};
    }

    const xmlString = await response.text();
    const value = parseFeatureInfoXML(xmlString);

    if (value === null) {
      return {};
    }

    // Map the value to the appropriate Product field based on overlay source
    if (overlaySource === GSLA_OVERLAY_SOURCE_ID) {
      return {
        [Product.GSLA_ANOMALY_SEA_LEVELS]: { gsla: value },
      };
    } else if (overlaySource === SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID) {
      return {
        [Product.SST_ANOMALY_MOSAIC]: { sstAnom: value },
      };
    }

    return {};
  } catch (error) {
    console.error('Error fetching overlay data:', error);
    return {};
  }
}

/**
 * Gathers all popup data from various sources (overlay, particles)
 * @returns Combined popup data object organized by Product types
 */
export async function getPopupData({
  lngLat,
  oceanCurrentData,
  overlay,
  particles,
  overlaySource,
  dataset,
  mapBounds,
  mapSize,
  point,
}: GetPopupDataArg): Promise<Partial<PopupData>> {
  const popupData: Partial<PopupData> = {};

  if (!mapBounds || !mapSize || !lngLat || !point) return popupData;

  if (overlay) {
    const overlayData = await fetchOverlayData(overlaySource, dataset, mapBounds, mapSize, point);
    Object.assign(popupData, overlayData);
  }

  if (particles && oceanCurrentData) {
    const oceanCurrentDetails = processOceanCurrentDetails(lngLat, oceanCurrentData);
    if (oceanCurrentDetails) {
      popupData[Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT] = {
        speed: oceanCurrentDetails.speed,
        direction: oceanCurrentDetails.direction,
        degree: oceanCurrentDetails.degree,
      };
    }
  }

  return popupData;
}

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

// Set and update popupdata in useMapPopup store, PopupContent component consume directly from this store.
export async function setPopupData(
  oceanCurrentData?: OceanCurrentDataResponse,
): Promise<{ popupEnabled: boolean }> {
  const { metaData } = useMapPopupStore.getState();
  const { particles, overlay, overlaySource, dataset } = useMapUIStore.getState();

  const popupData = await getPopupData({
    mapBounds: metaData.mapBounds,
    mapSize: metaData.mapSize,
    particles,
    oceanCurrentData,
    overlay,
    overlaySource,
    point: metaData.point,
    dataset,
    lngLat: metaData.lngLat,
  });

  if (Object.keys(popupData).length === 0) return { popupEnabled: false };
  batchUpdateMapPopup(popupData);
  return { popupEnabled: true };
}
