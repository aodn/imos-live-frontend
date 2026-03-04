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

const PADDING = 20;
const INNER_PADDING = 16;
const GAP = 16;
const RADIUS = 10;
const TITLE_LINE_HEIGHT = 24;
const SUB_LINE_HEIGHT = 18;
const SCALES_HEIGHT = 14;
const LABEL_HEIGHT = 14;
const LEGEND_MAX_WIDTH = 200;

const FRAME_PAD_L = 50;
const FRAME_PAD_R = 50;
const FRAME_PAD_T = 30;
const FRAME_PAD_B = 30;
const TICK_LEN = 6;
const FRAME_FONT_SIZE = 12;
const EARTH_RADIUS_KM = 6371;

// Scale bar + north arrow
const SCALE_BAR_SEGMENTS = 4;
const SCALE_BAR_H = 8;
const NORTH_ARROW_HALF_W = 9;
const NORTH_ARROW_UPPER_H = 26;
const NORTH_ARROW_LOWER_H = 12;
const SCALE_NORTH_GAP = 28; // gap between scale bar right label and north arrow
const SCALE_NORTH_MARGIN_R = 15;
const SCALE_NORTH_MARGIN_B = 15;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const downloadCanvasAsImage = (canvas: HTMLCanvasElement) => {
  const link = document.createElement('a');
  link.download = `map_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// --- Coordinate frame helpers ---
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

const niceGraticuleInterval = (span: number): number => {
  const rough = span / 5; // target ~5 ticks per side
  const candidates = [0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 30, 45, 60, 90];
  return candidates.find(c => c >= rough) ?? 90;
};

const formatCoord = (val: number): string => {
  const r = Math.round(val * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const drawFrostedBackground = (
  ctx: CanvasRenderingContext2D,
  mapCanvas: HTMLCanvasElement,
  mapOffsetX: number,
  mapOffsetY: number,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.clip();
  ctx.filter = 'blur(16px)';
  ctx.drawImage(mapCanvas, mapOffsetX, mapOffsetY);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

const drawInfoColumn = (ctx: CanvasRenderingContext2D, x: number, y: number, date: string) => {
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#1a2a3a';
  ctx.fillText('IMOS Live', x, y + TITLE_LINE_HEIGHT - 4);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#3b5068';
  ctx.fillText(date, x, y + TITLE_LINE_HEIGHT + SUB_LINE_HEIGHT - 4);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6b8a9e';
  ctx.fillText(
    'https://imoslive.edge.aodn.org.au',
    x,
    y + TITLE_LINE_HEIGHT + SUB_LINE_HEIGHT * 2 - 4,
  );
};

const drawProductColumn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  product: ExportProduct,
  legend: HTMLImageElement | null,
  legendWidth: number,
  legendHeight: number,
) => {
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#1a2a3a';
  ctx.fillText(product.name, x, y + SUB_LINE_HEIGHT - 4);

  if (!legend) return;

  const legendY = y + SUB_LINE_HEIGHT + 4;
  ctx.drawImage(legend, x, legendY, legendWidth, legendHeight);

  let cursorY = legendY + legendHeight;

  if (product.scales && product.scales.length > 0) {
    cursorY += 4;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#3b5068';
    ctx.textAlign = 'center';

    const count = product.scales.length;
    product.scales.forEach((scale, i) => {
      const scaleX = count === 1 ? x + legendWidth / 2 : x + (i / (count - 1)) * legendWidth;
      ctx.fillText(String(scale), scaleX, cursorY + SCALES_HEIGHT - 2);
    });

    ctx.textAlign = 'start';
    cursorY += SCALES_HEIGHT;
  }

  if (product.label) {
    cursorY += 4;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b8a9e';
    ctx.textAlign = 'center';
    ctx.fillText(product.label, x + legendWidth / 2, cursorY + LABEL_HEIGHT - 2);
    ctx.textAlign = 'start';
  }
};

const calculateLayout = (
  ctx: CanvasRenderingContext2D,
  mapHeight: number,
  logoAspect: number,
  product: ExportProduct | undefined,
  legend: HTMLImageElement | null,
) => {
  const leftColHeight = TITLE_LINE_HEIGHT + SUB_LINE_HEIGHT * 2;
  const logoWidth = logoAspect * leftColHeight;

  ctx.font = 'bold 18px sans-serif';
  const titleWidth = ctx.measureText('IMOS Live').width;
  ctx.font = '13px sans-serif';
  const dateWidth = ctx.measureText('9999-99-99').width;
  ctx.font = '12px sans-serif';
  const urlWidth = ctx.measureText('https://imoslive.edge.aodn.org.au').width;
  const leftColWidth = Math.max(titleWidth, dateWidth, urlWidth);

  ctx.font = 'bold 14px sans-serif';
  const productNameWidth = product ? ctx.measureText(product.name).width : 0;
  const legendWidth = legend ? Math.min(LEGEND_MAX_WIDTH, legend.width) : 0;
  const legendHeight = legend ? legend.height * (legendWidth / legend.width) : 0;
  const productColContentWidth = Math.max(productNameWidth, legendWidth);
  const productColWidth = product ? GAP + productColContentWidth : 0;

  const legendExtra = legend
    ? 8 +
      legendHeight +
      (product?.scales ? 4 + SCALES_HEIGHT : 0) +
      (product?.label ? 4 + LABEL_HEIGHT : 0)
    : 0;
  const productColHeight = product ? SUB_LINE_HEIGHT + legendExtra : 0;

  const tallestCol = Math.max(leftColHeight, productColHeight);

  const bgWidth = INNER_PADDING + logoWidth + GAP + leftColWidth + productColWidth + INNER_PADDING;
  const bgHeight = INNER_PADDING + tallestCol + INNER_PADDING;
  const bgX = PADDING;
  const bgY = mapHeight - bgHeight - PADDING;

  return {
    logoWidth,
    logoHeight: tallestCol,
    leftColWidth,
    legendWidth,
    legendHeight,
    bgX,
    bgY,
    bgWidth,
    bgHeight,
    contentX: bgX + INNER_PADDING,
    contentY: bgY + INNER_PADDING,
  };
};

const drawCoordinateFrame = (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
) => {
  const { west, east, south, north } = bounds;
  const southMerc = mercatorY(south);
  const northMerc = mercatorY(north);
  const lonInterval = niceGraticuleInterval(east - west);
  const latInterval = niceGraticuleInterval(north - south);

  // Border around the map
  ctx.save();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mapX, mapY, mapW, mapH);
  ctx.restore();

  ctx.save();
  ctx.font = `${FRAME_FONT_SIZE}px sans-serif`;
  ctx.fillStyle = '#1a2a3a';
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 1;

  // Longitude ticks — top and bottom edges
  const firstLon = Math.ceil(west / lonInterval) * lonInterval;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; ; i++) {
    const lon = Math.round((firstLon + i * lonInterval) * 1e6) / 1e6;
    if (lon > east + 1e-9) break;
    const px = mapX + lonToPixel(lon, west, east, mapW);
    const label = formatCoord(lon);

    ctx.beginPath();
    ctx.moveTo(px, mapY);
    ctx.lineTo(px, mapY - TICK_LEN);
    ctx.stroke();
    ctx.fillText(label, px, mapY - TICK_LEN - FRAME_FONT_SIZE / 2 - 2);

    ctx.beginPath();
    ctx.moveTo(px, mapY + mapH);
    ctx.lineTo(px, mapY + mapH + TICK_LEN);
    ctx.stroke();
    ctx.fillText(label, px, mapY + mapH + TICK_LEN + FRAME_FONT_SIZE / 2 + 2);
  }

  // Latitude ticks — left and right edges
  const firstLat = Math.ceil(south / latInterval) * latInterval;
  ctx.textBaseline = 'middle';
  for (let i = 0; ; i++) {
    const lat = Math.round((firstLat + i * latInterval) * 1e6) / 1e6;
    if (lat > north + 1e-9) break;
    const py = mapY + latToPixel(lat, southMerc, northMerc, mapH);
    const label = formatCoord(lat);

    ctx.textAlign = 'right';
    ctx.beginPath();
    ctx.moveTo(mapX, py);
    ctx.lineTo(mapX - TICK_LEN, py);
    ctx.stroke();
    ctx.fillText(label, mapX - TICK_LEN - 4, py);

    ctx.textAlign = 'left';
    ctx.beginPath();
    ctx.moveTo(mapX + mapW, py);
    ctx.lineTo(mapX + mapW + TICK_LEN, py);
    ctx.stroke();
    ctx.fillText(label, mapX + mapW + TICK_LEN + 4, py);
  }

  ctx.restore();
};

const drawNorthArrow = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number, // centre (widest point)
  upperH: number,
  lowerH: number,
  halfW: number,
) => {
  // Upper triangle — dark
  ctx.beginPath();
  ctx.moveTo(cx, cy - upperH);
  ctx.lineTo(cx - halfW, cy);
  ctx.lineTo(cx + halfW, cy);
  ctx.closePath();
  ctx.fillStyle = '#1a2a3a';
  ctx.fill();
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Lower triangle — white with outline
  ctx.beginPath();
  ctx.moveTo(cx, cy + lowerH);
  ctx.lineTo(cx - halfW, cy);
  ctx.lineTo(cx + halfW, cy);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // "N" above the tip
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#1a2a3a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('N', cx, cy - upperH - 2);
};

const drawScaleBar = (
  ctx: CanvasRenderingContext2D,
  bounds: MapBounds,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
) => {
  const { west, east, south, north } = bounds;
  const centerLat = (south + north) / 2;
  const latRad = (centerLat * Math.PI) / 180;
  const kmPerDegLon = (EARTH_RADIUS_KM * Math.PI * Math.cos(latRad)) / 180;
  const pixelsPerKm = mapW / (kmPerDegLon * (east - west));

  const maxKm = (mapW * 0.25) / pixelsPerKm;
  const niceKms = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  let scaleKm = niceKms[0];
  for (const k of niceKms) {
    if (k <= maxKm) scaleKm = k;
    else break;
  }
  const barW = scaleKm * pixelsPerKm;

  // North arrow anchor (bottom-right of map)
  const northArrowCX = mapX + mapW - SCALE_NORTH_MARGIN_R - NORTH_ARROW_HALF_W;
  const northArrowBottom = mapY + mapH - SCALE_NORTH_MARGIN_B;
  const northArrowCY = northArrowBottom - NORTH_ARROW_LOWER_H; // widest point

  // Scale bar sits to the left, bottom-aligned with the north arrow
  const barRightX = northArrowCX - NORTH_ARROW_HALF_W - SCALE_NORTH_GAP;
  const barX = barRightX - barW;
  const barBottom = northArrowBottom;
  const barTop = barBottom - SCALE_BAR_H;

  ctx.save();

  // ── Ruler-style scale bar ──
  ctx.strokeStyle = '#1a2a3a';
  ctx.fillStyle = '#1a2a3a';
  ctx.lineWidth = 1.2;

  // Bottom horizontal line
  ctx.beginPath();
  ctx.moveTo(barX, barBottom);
  ctx.lineTo(barRightX, barBottom);
  ctx.stroke();

  // Major ticks + labels
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let i = 0; i <= SCALE_BAR_SEGMENTS; i++) {
    const tx = barX + (i / SCALE_BAR_SEGMENTS) * barW;
    ctx.beginPath();
    ctx.moveTo(tx, barTop);
    ctx.lineTo(tx, barBottom);
    ctx.stroke();
    const km = Math.round((i / SCALE_BAR_SEGMENTS) * scaleKm);
    const label = i === SCALE_BAR_SEGMENTS ? `${km} km` : String(km);
    ctx.fillText(label, tx, barTop - 2);
  }

  // ── North arrow ──
  drawNorthArrow(
    ctx,
    northArrowCX,
    northArrowCY,
    NORTH_ARROW_UPPER_H,
    NORTH_ARROW_LOWER_H,
    NORTH_ARROW_HALF_W,
  );

  ctx.restore();
};

export const exportMapImage = async (
  mapCanvas: HTMLCanvasElement,
  date: string,
  product?: ExportProduct,
  bounds?: MapBounds,
) => {
  const mapW = mapCanvas.width;
  const mapH = mapCanvas.height;

  const padL = bounds ? FRAME_PAD_L : 0;
  const padR = bounds ? FRAME_PAD_R : 0;
  const padT = bounds ? FRAME_PAD_T : 0;
  const padB = bounds ? FRAME_PAD_B : 0;

  const totalW = mapW + padL + padR;
  const totalH = mapH + padT + padB;

  const offscreen = document.createElement('canvas');
  offscreen.width = totalW;
  offscreen.height = totalH;
  const ctx = offscreen.getContext('2d')!;

  // White background for frame area
  if (bounds) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);
  }

  // Draw map at offset
  ctx.drawImage(mapCanvas, padL, padT);

  // Draw coordinate frame and scale bar
  if (bounds) {
    drawCoordinateFrame(ctx, bounds, padL, padT, mapW, mapH);
    drawScaleBar(ctx, bounds, padL, padT, mapW, mapH);
  }

  let legend: HTMLImageElement | null = null;
  if (product?.legendUrl) {
    try {
      legend = await loadImage(product.legendUrl);
    } catch {
      product = undefined;
    }
  }
  const logo = await loadImage(imosLogo);
  const logoAspect = logo.width / logo.height;

  const layout = calculateLayout(ctx, mapH, logoAspect, product, legend);

  // Offset layout positions by frame padding
  const bgX = layout.bgX + padL;
  const bgY = layout.bgY + padT;
  const contentX = layout.contentX + padL;
  const contentY = layout.contentY + padT;

  drawFrostedBackground(ctx, mapCanvas, padL, padT, bgX, bgY, layout.bgWidth, layout.bgHeight);

  ctx.drawImage(logo, contentX, contentY, layout.logoWidth, layout.logoHeight);

  const textX = contentX + layout.logoWidth + GAP;
  ctx.shadowBlur = 0;
  drawInfoColumn(ctx, textX, contentY, date);

  if (product) {
    const productX = textX + layout.leftColWidth + GAP;
    drawProductColumn(
      ctx,
      productX,
      contentY,
      product,
      legend,
      layout.legendWidth,
      layout.legendHeight,
    );
  }

  downloadCanvasAsImage(offscreen);
};
