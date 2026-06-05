import { createElement } from 'react';
import { snapdom } from '@zumer/snapdom';
import type Highcharts from 'highcharts/highstock';
// Highcharts 12.4.0+ auto-registers these on import.
import 'highcharts/modules/accessibility';
import 'highcharts/modules/boost';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/offline-exporting';

import { ExportPanel } from '@/components';
import { canvasRootGenerator, pinExportLogoImg } from '@/helpers';
import { doubleRAF } from '@/utils';
import imosLogo from '@/assets/imos_logo_with_title.png';
import type { ExportConfig } from '../type';

/** Decodes the IMOS logo into the browser cache so the ExportPanel's `<img>` is
 *  `complete` the moment it mounts. Otherwise `pinExportLogoImg` sees offsetWidth=0
 *  (the `w-auto` image hasn't loaded) and snapdom captures the logo at zero width. */
function preloadLogo(): Promise<void> {
  const img = new Image();
  img.src = imosLogo;
  return img.decode().catch(() => undefined);
}

/** `getSVG` / `downloadCSV` / `downloadXLS` come from the exporting and
 *  export-data modules via prototype extension, so they aren't visible on
 *  the static `Highcharts.Chart` type at our installed @types version. */
type ChartWithExports = Highcharts.Chart & {
  getSVG: (chartOptions?: Highcharts.Options) => string;
  downloadCSV: () => void;
  downloadXLS: () => void;
  options: Highcharts.Options & { exporting: Highcharts.ExportingOptions };
};

/** Highcharts types the `onclick` handler as `(this: Chart) => void | boolean`,
 *  but at runtime it accepts async handlers and accesses prototype-extended
 *  methods. We type the handler bodies loosely and cast on assignment. */
type MenuItemOnClick = NonNullable<Highcharts.ExportingMenuObject['onclick']>;

/**
 * Render the chart as an SVG, paint it onto a canvas, optionally compose an
 * `ExportPanel` (with a frosted-glass background sampled from the chart) on
 * top, and trigger a browser download in the requested format.
 *
 * Almost-mirror of the panel-rendering logic in `mapImageExport.ts` — worth
 * extracting a shared helper once one more call site appears.
 */
function makeDownloadHandler(
  mimeType: string,
  ext: string,
  getFilename: () => string,
  selectedDate: string | undefined,
) {
  return async function (this: Highcharts.Chart) {
    const chart = this as ChartWithExports;
    const width = chart.chartWidth;
    const height = chart.chartHeight;
    const scale = 2;

    const svg = chart.getSVG({
      chart: { width, height },
      rangeSelector: { enabled: true, inputEnabled: true, buttons: [] },
      navigator: { enabled: true },
      scrollbar: { enabled: true },
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw chart first so we can extract the region behind the panel for frosted glass.
    await new Promise<void>(resolve => {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const chartImg = new Image();
      chartImg.onload = () => {
        ctx.drawImage(chartImg, 0, 0);
        URL.revokeObjectURL(svgUrl);
        resolve();
      };
      chartImg.src = svgUrl;
    });

    // Render ExportPanel with frosted glass on top of the chart.
    if (selectedDate) {
      const px = 6;
      const py = 12;
      const { root, container } = canvasRootGenerator();

      // Decode the logo before first render so the ExportPanel's `<img>` is complete
      // on mount — without this the logo is captured at zero width and goes missing.
      await preloadLogo();

      // First render to measure dimensions — two doubleRAF calls so the logo PNG has
      // time to load from cache before cssW is captured. Without this, `w-auto`
      // resolves to 0 on an unloaded image, making cssW too small and squishing the
      // panel.
      root.render(createElement(ExportPanel, { date: selectedDate, compact: true }));
      await doubleRAF();
      await doubleRAF();

      const el = container.firstElementChild as HTMLElement;
      const cssW = el.offsetWidth;
      const cssH = el.offsetHeight;

      // Extract the canvas region behind the panel for the frosted-glass background.
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = cssW * scale;
      bgCanvas.height = cssH * scale;
      bgCanvas
        .getContext('2d')!
        .drawImage(
          canvas,
          px * scale,
          py * scale,
          cssW * scale,
          cssH * scale,
          0,
          0,
          cssW * scale,
          cssH * scale,
        );
      const frostedBgSrc = bgCanvas.toDataURL();

      // Re-render with frosted background.
      root.render(createElement(ExportPanel, { date: selectedDate, compact: true, frostedBgSrc }));
      await doubleRAF();
      await doubleRAF(); // extra pass so the re-rendered logo img is committed before snapping

      pinExportLogoImg(el);
      const snap = await snapdom(el, { embedFonts: false });
      const panelCanvas = await snap.toCanvas({ scale });

      root.unmount();
      container.remove();

      ctx.drawImage(panelCanvas, px, py, cssW, cssH);
    }

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getFilename()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType);
  };
}

export function buildExportingConfig(exportingConfig: ExportConfig): Highcharts.ExportingOptions {
  if (!exportingConfig.enabled) {
    return { enabled: false };
  }

  const defaultMenuItems = [
    'downloadPNG',
    'downloadCSV',
    'downloadXLS',
    'downloadJPEG',
    'downloadPDF',
    'downloadSVG',
    'separator',
  ];

  // Maps ExportConfig.formats values to Highcharts menu item keys.
  const formatToMenuItem: Record<string, string> = {
    png: 'downloadPNG',
    jpeg: 'downloadJPEG',
    pdf: 'downloadPDF',
    svg: 'downloadSVG',
    csv: 'downloadCSV',
    xls: 'downloadXLS',
  };

  // Support a function so callers can compute the filename lazily at download
  // time (e.g. from a ref).
  const getFilename: () => string =
    typeof exportingConfig.filename === 'function'
      ? exportingConfig.filename
      : () => (exportingConfig.filename as string | undefined) || 'chart';
  const selectedDate = exportingConfig.selectedDate;

  return {
    enabled: true,
    filename: getFilename(),
    fallbackToExportServer: false,
    scale: 2,
    chartOptions: {
      rangeSelector: { enabled: false },
      navigator: { enabled: true },
      scrollbar: { enabled: true },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: false,
          },
        },
      },
    },
    // CSV/XLS handlers update chart.options.exporting.filename just before
    // download so the filename reflects the current visible range (read from
    // a ref) rather than the stale value baked into chart options at render
    // time. `downloadCSV` / `downloadXLS` are added by the export-data module
    // — see the `ChartWithExports` interface above.
    menuItemDefinitions: {
      downloadPNG: {
        text: 'Download Image',
        // Highcharts types onclick as `(this: Chart) => void | boolean`; our
        // PNG handler is async and runs prototype-extended methods. Cast on
        // assignment — function bodies remain properly typed.
        onclick: makeDownloadHandler(
          'image/png',
          'png',
          getFilename,
          selectedDate,
        ) as unknown as MenuItemOnClick,
      },
      downloadCSV: {
        text: 'Download CSV',
        onclick: function (this: Highcharts.Chart) {
          const chart = this as ChartWithExports;
          chart.options.exporting.filename = getFilename();
          chart.downloadCSV();
        } as MenuItemOnClick,
      },
      downloadXLS: {
        text: 'Download Excel',
        onclick: function (this: Highcharts.Chart) {
          const chart = this as ChartWithExports;
          chart.options.exporting.filename = getFilename();
          chart.downloadXLS();
        } as MenuItemOnClick,
      },
    },
    buttons: exportingConfig.buttons || {
      contextButton: {
        menuItems: exportingConfig.formats
          ? exportingConfig.formats.map(
              (format: string) => formatToMenuItem[format] ?? 'downloadPNG',
            )
          : defaultMenuItems,
      },
    },
  };
}
