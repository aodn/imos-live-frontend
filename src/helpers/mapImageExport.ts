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
  const logoHeight = 60;
  const logoWidth = logo.width * (logoHeight / logo.height);
  const padding = 20;
  const x = padding;
  const y = height - logoHeight - padding;

  ctx.drawImage(logo, x, y, logoWidth, logoHeight);

  const textX = x + logoWidth + 12;
  const lineHeight = 22;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;

  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('IMOS Live', textX, y + lineHeight);

  ctx.font = '15px sans-serif';
  ctx.fillText(date, textX, y + lineHeight * 2);
  ctx.fillText('https://imoslive.edge.aodn.org.au', textX, y + lineHeight * 3);

  downloadCanvasAsImage(offscreen);
};
