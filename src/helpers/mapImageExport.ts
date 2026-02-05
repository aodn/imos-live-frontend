import imosLogo from '@/assets/imos_logo_with_title.png';
import { type ProductName } from '@/constants';

type ExportProduct = {
  name: ProductName;
  legendUrl?: string;
  scales?: number[];
  label?: string;
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

const drawFrostedBackground = (
  ctx: CanvasRenderingContext2D,
  mapCanvas: HTMLCanvasElement,
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
  ctx.drawImage(mapCanvas, 0, 0);
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
  canvasHeight: number,
  logoAspect: number,
  product: ExportProduct | undefined,
  legend: HTMLImageElement | null,
) => {
  const leftColHeight = TITLE_LINE_HEIGHT + SUB_LINE_HEIGHT * 2;
  const logoWidth = logoAspect * leftColHeight;

  // Left column text widths
  ctx.font = 'bold 18px sans-serif';
  const titleWidth = ctx.measureText('IMOS Live').width;
  ctx.font = '13px sans-serif';
  const dateWidth = ctx.measureText('9999-99-99').width; // stable measurement
  ctx.font = '12px sans-serif';
  const urlWidth = ctx.measureText('https://imoslive.edge.aodn.org.au').width;
  const leftColWidth = Math.max(titleWidth, dateWidth, urlWidth);

  // Product column
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
  const bgY = canvasHeight - bgHeight - PADDING;

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

export const exportMapImage = async (
  mapCanvas: HTMLCanvasElement,
  date: string,
  product?: ExportProduct,
) => {
  const { width, height } = mapCanvas;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d')!;

  ctx.drawImage(mapCanvas, 0, 0);

  let legend: HTMLImageElement | null = null;
  if (product?.legendUrl) {
    try {
      legend = await loadImage(product.legendUrl);
    } catch {
      product = undefined;
      // if product enabled and product has valid legendUrl, show product column. Otherwise, no product column.
    }
  }
  const logo = await loadImage(imosLogo);
  const logoAspect = logo.width / logo.height;

  const layout = calculateLayout(ctx, height, logoAspect, product, legend);

  drawFrostedBackground(ctx, mapCanvas, layout.bgX, layout.bgY, layout.bgWidth, layout.bgHeight);

  ctx.drawImage(logo, layout.contentX, layout.contentY, layout.logoWidth, layout.logoHeight);

  const textX = layout.contentX + layout.logoWidth + GAP;
  ctx.shadowBlur = 0;
  drawInfoColumn(ctx, textX, layout.contentY, date);

  if (product) {
    const productX = textX + layout.leftColWidth + GAP;
    drawProductColumn(
      ctx,
      productX,
      layout.contentY,
      product,
      legend,
      layout.legendWidth,
      layout.legendHeight,
    );
  }

  downloadCanvasAsImage(offscreen);
};
