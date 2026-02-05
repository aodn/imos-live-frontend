import imosLogo from '@/assets/imos_logo_with_title.png';

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

export const exportMapImage = async (mapCanvas: HTMLCanvasElement, date: string) => {
  const { width, height } = mapCanvas;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d')!;

  ctx.drawImage(mapCanvas, 0, 0);

  const logo = await loadImage(imosLogo);
  const padding = 20;
  const innerPadding = 16;
  const titleLineHeight = 24;
  const subLineHeight = 18;
  const contentHeight = titleLineHeight + subLineHeight * 2;
  const logoHeight = contentHeight;
  const logoWidth = logo.width * (logoHeight / logo.height);
  const gap = 16;

  // Measure text width to size the background
  ctx.font = 'bold 18px sans-serif';
  const titleWidth = ctx.measureText('IMOS Live').width;
  ctx.font = '12px sans-serif';
  const urlWidth = ctx.measureText('https://imoslive.edge.aodn.org.au').width;
  const dateWidth = ctx.measureText(date).width;
  const maxTextWidth = Math.max(titleWidth, urlWidth, dateWidth);

  const bgWidth = innerPadding + logoWidth + gap + maxTextWidth + innerPadding;
  const bgHeight = innerPadding + contentHeight + innerPadding;
  const bgX = padding;
  const bgY = height - bgHeight - padding;
  const radius = 10;

  // Frosted glass background
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius);
  ctx.clip();
  ctx.filter = 'blur(16px)';
  ctx.drawImage(mapCanvas, 0, 0);
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  ctx.restore();

  // Border
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Logo
  const contentX = bgX + innerPadding;
  const contentY = bgY + innerPadding;
  ctx.drawImage(logo, contentX, contentY, logoWidth, logoHeight);

  // Text
  const textX = contentX + logoWidth + gap;
  ctx.shadowBlur = 0;

  // Title
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#1a2a3a';
  ctx.fillText('IMOS Live', textX, contentY + titleLineHeight - 4);

  // Date
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#3b5068';
  ctx.fillText(date, textX, contentY + titleLineHeight + subLineHeight - 4);

  // URL — lighter to de-emphasize
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6b8a9e';
  ctx.fillText(
    'https://imoslive.edge.aodn.org.au',
    textX,
    contentY + titleLineHeight + subLineHeight * 2 - 4,
  );

  downloadCanvasAsImage(offscreen);
};
