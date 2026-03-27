import imosLogo from '@/assets/imos_logo_with_title.png';
import { type ProductName } from '@/constants';

type ExportProduct = {
  name: ProductName;
  legendUrl?: string;
  scales?: number[];
  label?: string;
};

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

/** Below this CSS width the compact theme is applied for a better fit. */
const COMPACT_BREAKPOINT_PX = 800;

// Themes — all layout-sensitive constants live here so narrow maps can scale.
type ExportTheme = {
  // Info panel background
  panelPadding: number;
  panelInner: number;
  panelGap: number;
  panelRadius: number;
  // Panel text / content
  titleLineH: number;
  titleFontSize: number;
  subLineH: number;
  subFontSize: number;
  urlFontSize: number;
  productNameFontSize: number;
  scalesLabelFontSize: number;
  scalesH: number;
  labelH: number;
  legendMaxW: number;
  // Coordinate frame
  // framePadL/R must fit: tickLen + frameFontSize + ~20 px of margin
  framePadL: number;
  framePadR: number;
  framePadT: number;
  framePadB: number;
  tickLen: number;
  frameFontSize: number;
  minTickLabelGapPx: number;
  // Scale bar & north arrow
  scaleBarFontSize: number;
  scaleBarH: number;
  scaleBarTargetPx: number; // target bar pixel width (independent of map size)
  scaleBarSegments: number; // number of intervals (1 = just 0 and X km; 2 = also midpoint)
  arrowHalfW: number;
  arrowUpperH: number;
  arrowLowerH: number;
  barToArrowGap: number;
  scaleMarginRight: number;
  scaleMarginBottom: number;
};

const NORMAL_THEME: ExportTheme = {
  panelPadding: 20,
  panelInner: 16,
  panelGap: 16,
  panelRadius: 10,
  titleLineH: 24,
  titleFontSize: 18,
  subLineH: 18,
  subFontSize: 13,
  urlFontSize: 12,
  productNameFontSize: 14,
  scalesLabelFontSize: 10,
  scalesH: 14,
  labelH: 14,
  legendMaxW: 200,
  framePadL: 50,
  framePadR: 50,
  framePadT: 30,
  framePadB: 30,
  tickLen: 6,
  frameFontSize: 12,
  minTickLabelGapPx: 60,
  scaleBarFontSize: 14,
  scaleBarH: 8,
  scaleBarTargetPx: 150,
  scaleBarSegments: 2,
  arrowHalfW: 14,
  arrowUpperH: 26,
  arrowLowerH: 12,
  barToArrowGap: 42,
  scaleMarginRight: 15,
  scaleMarginBottom: 20,
};

const COMPACT_THEME: ExportTheme = {
  panelPadding: 12,
  panelInner: 10,
  panelGap: 10,
  panelRadius: 8,
  titleLineH: 18,
  titleFontSize: 13,
  subLineH: 14,
  subFontSize: 10,
  urlFontSize: 10,
  productNameFontSize: 11,
  scalesLabelFontSize: 8,
  scalesH: 10,
  labelH: 10,
  legendMaxW: 130,
  framePadL: 36,
  framePadR: 36,
  framePadT: 22,
  framePadB: 22,
  tickLen: 4,
  frameFontSize: 10,
  minTickLabelGapPx: 45,
  scaleBarFontSize: 11,
  scaleBarH: 6,
  scaleBarTargetPx: 100,
  scaleBarSegments: 1,
  arrowHalfW: 10,
  arrowUpperH: 18,
  arrowLowerH: 8,
  barToArrowGap: 28,
  scaleMarginRight: 10,
  scaleMarginBottom: 12,
};

// Fixed constants (not theme-dependent)
const PANEL_BLUR_PX = 16;
const PANEL_FILL_ALPHA = 0.7;
const EARTH_RADIUS_KM = 6371;
const MAX_TICKS_PER_AXIS = 5;
const MAX_GRATICULE_TICKS = 1000;

// Utilities
/** Loads an image from a URL, rejecting if it fails. */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

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

/** Maps a latitude to a canvas Y pixel using Mercator projection. */
const latToPixel = (lat: number, southMerc: number, northMerc: number, mapH: number): number => {
  const latMerc = mercatorY(lat);
  return mapH * (1 - (latMerc - southMerc) / (northMerc - southMerc));
};

/** Maps a longitude to a canvas X pixel (linear, no projection needed). */
const lonToPixel = (lon: number, west: number, east: number, mapW: number): number =>
  (mapW * (lon - west)) / (east - west);

/** Returns a human-friendly graticule interval (degrees) that fits within the available pixels. */
const niceGraticuleInterval = (span: number, availablePx: number, t: ExportTheme): number => {
  const maxTicks = Math.min(
    MAX_TICKS_PER_AXIS,
    Math.max(2, Math.floor(availablePx / t.minTickLabelGapPx)),
  );
  const rough = span / maxTicks;
  const candidates = [0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 30, 45, 60, 90];
  return candidates.find(c => c >= rough) ?? 90;
};

/** Formats a coordinate value, omitting the decimal if it's a whole number. */
const formatCoord = (val: number): string => {
  const r = Math.round(val * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

/** Returns the largest human-friendly km value that fits within maxKm. */
const niceScaleKm = (maxKm: number): number => {
  // Sub-km candidates handle very small maps or highly zoomed-in views.
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  let result = candidates[0];
  for (const k of candidates) {
    if (k <= maxKm) result = k;
    else break;
  }
  return result;
};

// Drawing functions

/** Draws a frosted-glass rounded rectangle by blurring and tinting the underlying map. */
const drawFrostedBackground = (
  ctx: CanvasRenderingContext2D,
  mapCanvas: HTMLCanvasElement,
  mapOffsetX: number,
  mapOffsetY: number,
  x: number,
  y: number,
  w: number,
  h: number,
  t: ExportTheme,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, t.panelRadius);
  ctx.clip();
  ctx.filter = `blur(${PANEL_BLUR_PX}px)`;
  ctx.drawImage(mapCanvas, mapOffsetX, mapOffsetY);
  ctx.filter = 'none';
  ctx.fillStyle = `rgba(255, 255, 255, ${PANEL_FILL_ALPHA})`;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, t.panelRadius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

/** Draws the title, date, and URL text in the info panel. */
const drawInfoColumn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  date: string,
  t: ExportTheme,
) => {
  ctx.font = `bold ${t.titleFontSize}px sans-serif`;
  ctx.fillStyle = '#1a2a3a';
  ctx.fillText('IMOS Live', x, y + t.titleLineH - 4);

  ctx.font = `${t.subFontSize}px sans-serif`;
  ctx.fillStyle = '#3b5068';
  ctx.fillText(date, x, y + t.titleLineH + t.subLineH - 4);

  ctx.font = `${t.urlFontSize}px sans-serif`;
  ctx.fillStyle = '#6b8a9e';
  ctx.fillText('https://imoslive.edge.aodn.org.au', x, y + t.titleLineH + t.subLineH * 2 - 4);
};

/** Draws the product name, legend image, scale values, and label in the info panel. */
const drawProductColumn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  product: ExportProduct,
  legend: HTMLImageElement | null,
  legendWidth: number,
  legendHeight: number,
  t: ExportTheme,
) => {
  ctx.font = `bold ${t.productNameFontSize}px sans-serif`;
  ctx.fillStyle = '#1a2a3a';
  ctx.fillText(product.name, x, y + t.subLineH - 4);

  if (!legend) return;

  const legendY = y + t.subLineH + 4;
  ctx.drawImage(legend, x, legendY, legendWidth, legendHeight);
  let cursorY = legendY + legendHeight;

  if (product.scales && product.scales.length > 0) {
    cursorY += 4;
    ctx.font = `${t.scalesLabelFontSize}px sans-serif`;
    ctx.fillStyle = '#3b5068';
    ctx.textAlign = 'center';
    const count = product.scales.length;
    product.scales.forEach((scale, i) => {
      const scaleX = count === 1 ? x + legendWidth / 2 : x + (i / (count - 1)) * legendWidth;
      ctx.fillText(String(scale), scaleX, cursorY + t.scalesH - 2);
    });
    ctx.textAlign = 'start';
    cursorY += t.scalesH;
  }

  if (product.label) {
    cursorY += 4;
    ctx.font = `${t.scalesLabelFontSize}px sans-serif`;
    ctx.fillStyle = '#6b8a9e';
    ctx.textAlign = 'center';
    ctx.fillText(product.label, x + legendWidth / 2, cursorY + t.labelH - 2);
    ctx.textAlign = 'start';
  }
};

/** Draws a simple north-pointing arrow. */
const drawNorthArrow = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  tipY: number,
  bottomY: number,
  halfWidth: number,
) => {
  const notchY = bottomY - halfWidth * 1.1;

  ctx.save();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx + halfWidth, bottomY);
  ctx.lineTo(cx, notchY);
  ctx.lineTo(cx - halfWidth, bottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

/** Draws a horizontal scale bar and north arrow in the bottom-right of the map area. */
const drawScaleBar = (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  t: ExportTheme,
) => {
  const mb = t.scaleMarginBottom;
  const { west, east, south, north } = bounds;
  const centerLatRad = (((south + north) / 2) * Math.PI) / 180;
  const kmPerDegLon = (EARTH_RADIUS_KM * Math.PI * Math.cos(centerLatRad)) / 180;
  const pixelsPerKm = mapW / (kmPerDegLon * (east - west));

  const arrowCX = mapX + mapW - t.scaleMarginRight - t.arrowHalfW;
  const arrowBottomY = mapY + mapH - mb;
  const arrowTipY = arrowBottomY - t.arrowLowerH - t.arrowUpperH;

  // If the arrow tip would be above the map area there's no room — skip drawing.
  if (arrowTipY < mapY) return;

  const barRightX = arrowCX - t.arrowHalfW - t.barToArrowGap;
  // Limit the bar so barX never goes left of the map edge.
  const maxBarPx = Math.max(0, barRightX - mapX);
  const scaleKm = niceScaleKm(Math.min(t.scaleBarTargetPx / pixelsPerKm, maxBarPx / pixelsPerKm));
  const barWidth = scaleKm * pixelsPerKm;
  const barX = barRightX - barWidth;
  const barBottom = arrowBottomY;
  const barTop = barBottom - t.scaleBarH;

  ctx.save();
  ctx.strokeStyle = '#1a2a3a';
  ctx.fillStyle = '#1a2a3a';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(barX, barBottom);
  ctx.lineTo(barRightX, barBottom);
  ctx.stroke();

  ctx.font = `${t.scaleBarFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let i = 0; i <= t.scaleBarSegments; i++) {
    const tx = barX + (i / t.scaleBarSegments) * barWidth;
    const km = (i / t.scaleBarSegments) * scaleKm;
    const label = i === t.scaleBarSegments ? `${Math.round(km)} km` : String(Math.round(km));
    ctx.beginPath();
    ctx.moveTo(tx, barTop);
    ctx.lineTo(tx, barBottom);
    ctx.stroke();
    ctx.fillText(label, tx, barTop - 2);
  }

  drawNorthArrow(ctx, arrowCX, arrowTipY, arrowBottomY, t.arrowHalfW);

  ctx.restore();
};

/** Draws a border and lat/lon tick labels around the map area. */
const drawCoordinateFrame = (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  t: ExportTheme,
) => {
  const { west, east, south, north } = bounds;
  const southMerc = mercatorY(south);
  const northMerc = mercatorY(north);
  const lonInterval = niceGraticuleInterval(east - west, mapW, t);
  const latInterval = niceGraticuleInterval(north - south, mapH, t);

  // Border around the map
  ctx.save();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mapX, mapY, mapW, mapH);
  ctx.restore();

  ctx.save();
  ctx.font = `${t.frameFontSize}px sans-serif`;
  ctx.fillStyle = '#1a2a3a';
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 1;

  // Longitude ticks — top and bottom edges
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

  // Latitude ticks — left and right edges
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

/** Measures text and computes pixel geometry for the frosted info panel. */
const calculateInfoPanelLayout = ({
  ctx,
  mapAreaH,
  logoAspect,
  product,
  legend,
  t,
}: {
  ctx: CanvasRenderingContext2D;
  mapAreaH: number;
  logoAspect: number;
  product: ExportProduct | undefined;
  legend: HTMLImageElement | null;
  t: ExportTheme;
}) => {
  const leftColHeight = t.titleLineH + t.subLineH * 2;
  const logoWidth = logoAspect * leftColHeight;

  ctx.font = `bold ${t.titleFontSize}px sans-serif`;
  const titleWidth = ctx.measureText('IMOS Live').width;
  ctx.font = `${t.subFontSize}px sans-serif`;
  const dateWidth = ctx.measureText('9999-99-99').width;
  ctx.font = `${t.urlFontSize}px sans-serif`;
  const urlWidth = ctx.measureText('https://imoslive.edge.aodn.org.au').width;
  const leftColWidth = Math.max(titleWidth, dateWidth, urlWidth);

  ctx.font = `bold ${t.productNameFontSize}px sans-serif`;
  const productNameWidth = product ? ctx.measureText(product.name).width : 0;
  const legendWidth = legend ? Math.min(t.legendMaxW, legend.width) : 0;
  const legendHeight = legend ? legend.height * (legendWidth / legend.width) : 0;
  const productColContentWidth = Math.max(productNameWidth, legendWidth);
  const productColWidth = product ? t.panelGap + productColContentWidth : 0;

  const legendExtra = legend
    ? 8 + legendHeight + (product?.scales ? 4 + t.scalesH : 0) + (product?.label ? 4 + t.labelH : 0)
    : 0;
  const productColHeight = product ? t.subLineH + legendExtra : 0;
  const contentHeight = Math.max(leftColHeight, productColHeight);

  const bgWidth =
    t.panelInner + logoWidth + t.panelGap + leftColWidth + productColWidth + t.panelInner;
  const bgHeight = t.panelInner + contentHeight + t.panelInner;
  const bgX = t.panelPadding;
  const bgY = mapAreaH - bgHeight - t.panelPadding;

  return {
    logoWidth,
    logoHeight: contentHeight,
    leftColWidth,
    legendWidth,
    legendHeight,
    bgX,
    bgY,
    bgWidth,
    bgHeight,
    contentX: bgX + t.panelInner,
    contentY: bgY + t.panelInner,
  };
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
  const t = mapCanvas.clientWidth < COMPACT_BREAKPOINT_PX ? COMPACT_THEME : NORMAL_THEME;

  const padL = bounds ? t.framePadL : 0;
  const padR = bounds ? t.framePadR : 0;
  const padT = bounds ? t.framePadT : 0;
  const padB = bounds ? t.framePadB : 0;

  const offscreen = document.createElement('canvas');
  offscreen.width = mapW + padL + padR;
  offscreen.height = mapH + padT + padB;
  const ctx = offscreen.getContext('2d')!;

  if (bounds) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  }

  let legend: HTMLImageElement | null = null;
  if (product?.legendUrl) {
    try {
      legend = await loadImage(product.legendUrl);
    } catch {
      product = undefined; // hide the product column entirely if the legend image fails to load
    }
  }
  const logo = await loadImage(imosLogo);
  const layout = calculateInfoPanelLayout({
    ctx,
    mapAreaH: mapH,
    logoAspect: logo.width / logo.height,
    product,
    legend,
    t,
  });

  ctx.drawImage(mapCanvas, padL, padT);

  if (bounds) {
    drawCoordinateFrame(ctx, bounds, padL, padT, mapW, mapH, t);
    drawScaleBar(ctx, bounds, padL, padT, mapW, mapH, t);
  }

  const bgX = layout.bgX + padL;
  const bgY = layout.bgY + padT;
  const contentX = layout.contentX + padL;
  const contentY = layout.contentY + padT;

  drawFrostedBackground(ctx, mapCanvas, padL, padT, bgX, bgY, layout.bgWidth, layout.bgHeight, t);

  ctx.drawImage(logo, contentX, contentY, layout.logoWidth, layout.logoHeight);

  const textX = contentX + layout.logoWidth + t.panelGap;
  drawInfoColumn(ctx, textX, contentY, date, t);

  if (product) {
    drawProductColumn(
      ctx,
      textX + layout.leftColWidth + t.panelGap,
      contentY,
      product,
      legend,
      layout.legendWidth,
      layout.legendHeight,
      t,
    );
  }

  downloadCanvasAsImage(offscreen);
};
