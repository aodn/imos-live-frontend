import type { ReactNode } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { snapdom } from '@zumer/snapdom';
import { type ProductName } from '@/constants';
import { queryClient } from '@/config/reactQueryConfig';
import { ExportPanel, MapScaleBar } from '@/components';
import { doubleRAF } from '@/utils';

export type ExportProduct = {
  name: ProductName;
  legend?: ReactNode;
};

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

/** Below this CSS width the compact theme is applied for a better fit. */
const COMPACT_BREAKPOINT_PX = 800;

type CanvasTheme = {
  canvasBg: string;
  panelPadding: number;
  framePadL: number;
  framePadR: number;
  framePadT: number;
  framePadB: number;
  tickLen: number;
  frameFontSize: number;
  minTickLabelGapPx: number;
  frameColor: string;
  scaleBarTargetPx: number;
  scaleMarginRight: number;
  scaleMarginBottom: number;
};

const NORMAL_THEME: CanvasTheme = {
  canvasBg: '#ffffff',
  panelPadding: 20,
  framePadL: 50,
  framePadR: 50,
  framePadT: 30,
  framePadB: 30,
  tickLen: 6,
  frameFontSize: 12,
  minTickLabelGapPx: 60,
  frameColor: '#1a2a3a',
  scaleBarTargetPx: 150,
  scaleMarginRight: 15,
  scaleMarginBottom: 20,
};

const COMPACT_THEME: CanvasTheme = {
  canvasBg: '#ffffff',
  panelPadding: 12,
  framePadL: 36,
  framePadR: 36,
  framePadT: 22,
  framePadB: 22,
  tickLen: 4,
  frameFontSize: 10,
  minTickLabelGapPx: 45,
  frameColor: '#1a2a3a',
  scaleBarTargetPx: 100,
  scaleMarginRight: 10,
  scaleMarginBottom: 12,
};

// Fixed constants
const EARTH_RADIUS_KM = 6371;
const MAX_TICKS_PER_AXIS = 5;
const MAX_GRATICULE_TICKS = 1000;

// Utilities

/** Triggers a PNG download of the given canvas. */
const downloadCanvasAsImage = (canvas: HTMLCanvasElement) => {
  const link = document.createElement('a');
  link.download = `map_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/** Converts latitude to Mercator Y for proportional pixel mapping. */
const mercatorY = (lat: number): number => {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
};

const latToPixel = (lat: number, southMerc: number, northMerc: number, mapH: number): number => {
  const latMerc = mercatorY(lat);
  return mapH * (1 - (latMerc - southMerc) / (northMerc - southMerc));
};

const lonToPixel = (lon: number, west: number, east: number, mapW: number): number =>
  (mapW * (lon - west)) / (east - west);

const niceGraticuleInterval = (span: number, availablePx: number, t: CanvasTheme): number => {
  const maxTicks = Math.min(
    MAX_TICKS_PER_AXIS,
    Math.max(2, Math.floor(availablePx / t.minTickLabelGapPx)),
  );
  const rough = span / maxTicks;
  const candidates = [0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 30, 45, 60, 90];
  return candidates.find(c => c >= rough) ?? 90;
};

const formatCoord = (val: number): string => {
  const r = Math.round(val * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const niceScaleKm = (maxKm: number): number => {
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  let result = candidates[0];
  for (const k of candidates) {
    if (k <= maxKm) result = k;
    else break;
  }
  return result;
};

export const canvasRootGenerator = () => {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;z-index:-1;pointer-events:none;';
  document.body.appendChild(container);
  return { root: createRoot(container), container };
};

// Drawing functions

const renderScaleIndicator = async (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  t: CanvasTheme,
  compact: boolean,
) => {
  const dpr = window.devicePixelRatio || 1;
  const { west, east, south, north } = bounds;
  const centerLatRad = (((south + north) / 2) * Math.PI) / 180;
  const kmPerDegLon = (EARTH_RADIUS_KM * Math.PI * Math.cos(centerLatRad)) / 180;
  const pixelsPerKm = mapW / (kmPerDegLon * (east - west));

  const maxBarPhysPx = Math.max(0, mapW * 0.4 - t.scaleMarginRight);
  const scaleKm = niceScaleKm(
    Math.min(t.scaleBarTargetPx / pixelsPerKm, maxBarPhysPx / pixelsPerKm),
  );
  if (scaleKm <= 0) return;

  const barWidthCss = (scaleKm * pixelsPerKm) / dpr;

  const { root, container } = canvasRootGenerator();

  root.render(createElement(MapScaleBar, { scaleKm, barWidthCss, compact }));
  await doubleRAF();

  const el = container.firstElementChild as HTMLElement;
  const physW = Math.round(el.offsetWidth * dpr);
  const physH = Math.round(el.offsetHeight * dpr);

  const x = mapX + mapW - physW - t.scaleMarginRight;
  const y = mapY + mapH - physH - t.scaleMarginBottom;

  if (y < mapY) {
    root.unmount();
    container.remove();
    return;
  }

  const snap = await snapdom(el, { embedFonts: false });
  const scaleCanvas = await snap.toCanvas({ scale: dpr });
  ctx.drawImage(scaleCanvas, x, y, physW, physH);

  root.unmount();
  container.remove();
};

/**
 * Pre-loads all cached raster legend URLs as browser images.
 * This ensures img.complete = true when the component renders, so the browser
 * fires onLoad as a queued task and React can flush isLoading=false before we snap.
 */
const prewarmLegendImages = (): Promise<void[]> =>
  Promise.all(
    queryClient
      .getQueryCache()
      .getAll()
      .filter(q => Array.isArray(q.queryKey) && q.queryKey[0] === 'rasterLegendUrl')
      .map(q => q.state.data as string | undefined)
      .filter((url): url is string => Boolean(url))
      .map(
        url =>
          new Promise<void>(resolve => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          }),
      ),
  );

/** Renders MapExportPanel off-screen via React, captures it with snapdom, and draws it onto ctx. */
const renderInfoPanel = async (
  ctx: CanvasRenderingContext2D,
  offscreenCanvas: HTMLCanvasElement,
  mapX: number,
  mapY: number,
  mapH: number,
  date: string,
  product: ExportProduct | undefined,
  compact: boolean,
  panelPadding: number,
) => {
  const { root, container } = canvasRootGenerator();

  const panelProps = {
    date,
    product: product ? { name: product.name, legend: product.legend } : undefined,
    compact,
  };

  try {
    const wrap = (extraProps?: { frostedBgSrc?: string }) =>
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ExportPanel, { ...panelProps, ...extraProps }),
      );

    // Pre-warm cached legend images so img.complete=true when the component mounts.
    // This causes the browser to queue an onLoad task, which React flushes within doubleRAF.
    await prewarmLegendImages();

    // First render to measure dimensions
    root.render(wrap());
    await doubleRAF(); // onLoad fires as queued task → React flushes isLoading=false
    await doubleRAF(); // extra pass to ensure React re-render is committed

    const el = container.firstElementChild as HTMLElement;
    const cssW = el.offsetWidth;
    const cssH = el.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    const physW = Math.round(cssW * dpr);
    const physH = Math.round(cssH * dpr);

    // Position: bottom-left of map area (physical canvas pixels)
    const x = mapX + panelPadding;
    const y = mapY + mapH - physH - panelPadding;

    // Extract the canvas region behind the panel for the frosted-glass effect
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = physW;
    bgCanvas.height = physH;
    bgCanvas.getContext('2d')!.drawImage(offscreenCanvas, -x, -y);
    const frostedBgSrc = bgCanvas.toDataURL();

    // Re-render with frosted background
    root.render(wrap({ frostedBgSrc }));
    await doubleRAF();
    await doubleRAF();

    // Pin only the logo img — it has `w-auto` which snapdom misresolves
    const logoImg = el.querySelector<HTMLImageElement>('[data-export-logo]');
    if (logoImg && logoImg.offsetWidth > 0) logoImg.style.width = `${logoImg.offsetWidth}px`;
    const snap = await snapdom(el, { embedFonts: false });
    const panelCanvas = await snap.toCanvas({ scale: dpr });

    // snapdom loses color fidelity when serialising <img> elements.
    // Find the raster legend img and redraw it directly so its pixels are exact.
    const legendImg = el.querySelector('[data-export-legend] img') as HTMLImageElement | null;
    if (legendImg?.complete && legendImg.naturalWidth > 0) {
      const panelRect = el.getBoundingClientRect();
      const imgRect = legendImg.getBoundingClientRect();
      const lx = (imgRect.left - panelRect.left) * dpr;
      const ly = (imgRect.top - panelRect.top) * dpr;
      const lw = imgRect.width * dpr;
      const lh = imgRect.height * dpr;
      panelCanvas.getContext('2d')!.drawImage(legendImg, lx, ly, lw, lh);
    }

    ctx.drawImage(panelCanvas, x, y, physW, physH);
  } finally {
    root.unmount();
    container.remove();
  }
};

// Draw on cavas as it needs dynamic computation.
const drawCoordinateFrame = (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  t: CanvasTheme,
) => {
  const { west, east, south, north } = bounds;
  const southMerc = mercatorY(south);
  const northMerc = mercatorY(north);
  const lonInterval = niceGraticuleInterval(east - west, mapW, t);
  const latInterval = niceGraticuleInterval(north - south, mapH, t);

  ctx.save();
  ctx.strokeStyle = t.frameColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mapX, mapY, mapW, mapH);
  ctx.restore();

  ctx.save();
  ctx.font = `${t.frameFontSize}px sans-serif`;
  ctx.fillStyle = t.frameColor;
  ctx.strokeStyle = t.frameColor;
  ctx.lineWidth = 1;

  const firstLon = Math.ceil(west / lonInterval) * lonInterval;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let lonI = 0;
  while (lonI < MAX_GRATICULE_TICKS) {
    const lon = Math.round((firstLon + lonI++ * lonInterval) * 1e6) / 1e6;
    if (lon > east + 1e-9) break;
    const px = mapX + lonToPixel(lon, west, east, mapW);
    const label = formatCoord(lon);
    ctx.beginPath();
    ctx.moveTo(px, mapY);
    ctx.lineTo(px, mapY - t.tickLen);
    ctx.stroke();
    ctx.fillText(label, px, mapY - t.tickLen - t.frameFontSize / 2 - 2);
    ctx.beginPath();
    ctx.moveTo(px, mapY + mapH);
    ctx.lineTo(px, mapY + mapH + t.tickLen);
    ctx.stroke();
    ctx.fillText(label, px, mapY + mapH + t.tickLen + t.frameFontSize / 2 + 2);
  }

  const firstLat = Math.ceil(south / latInterval) * latInterval;
  ctx.textBaseline = 'middle';
  let latI = 0;
  while (latI < MAX_GRATICULE_TICKS) {
    const lat = Math.round((firstLat + latI++ * latInterval) * 1e6) / 1e6;
    if (lat > north + 1e-9) break;
    const py = mapY + latToPixel(lat, southMerc, northMerc, mapH);
    const label = formatCoord(lat);
    ctx.textAlign = 'right';
    ctx.beginPath();
    ctx.moveTo(mapX, py);
    ctx.lineTo(mapX - t.tickLen, py);
    ctx.stroke();
    ctx.fillText(label, mapX - t.tickLen - 4, py);
    ctx.textAlign = 'left';
    ctx.beginPath();
    ctx.moveTo(mapX + mapW, py);
    ctx.lineTo(mapX + mapW + t.tickLen, py);
    ctx.stroke();
    ctx.fillText(label, mapX + mapW + t.tickLen + 4, py);
  }

  ctx.restore();
};

/** Renders the map canvas to a PNG with coordinate frame, scale bar, and info panel, then downloads it. */
export const exportMapImage = async (
  mapCanvas: HTMLCanvasElement,
  date: string,
  product?: ExportProduct,
  bounds?: MapBounds,
) => {
  const mapW = mapCanvas.width;
  const mapH = mapCanvas.height;
  const compact = mapCanvas.clientWidth < COMPACT_BREAKPOINT_PX;
  const t = compact ? COMPACT_THEME : NORMAL_THEME;

  const padL = bounds ? t.framePadL : 0;
  const padR = bounds ? t.framePadR : 0;
  const padT = bounds ? t.framePadT : 0;
  const padB = bounds ? t.framePadB : 0;

  const offscreen = document.createElement('canvas');
  offscreen.width = mapW + padL + padR;
  offscreen.height = mapH + padT + padB;
  const ctx = offscreen.getContext('2d')!;

  if (bounds) {
    ctx.fillStyle = t.canvasBg;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  }

  ctx.drawImage(mapCanvas, padL, padT);

  if (bounds) {
    drawCoordinateFrame(ctx, bounds, padL, padT, mapW, mapH, t);
    await renderScaleIndicator(ctx, bounds, padL, padT, mapW, mapH, t, compact);
  }

  await renderInfoPanel(ctx, offscreen, padL, padT, mapH, date, product, compact, t.panelPadding);

  downloadCanvasAsImage(offscreen);
};
