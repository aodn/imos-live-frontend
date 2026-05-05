import type { BuoyItemContent } from '@/types';
import type Highcharts from 'highcharts/highstock'; // Use highstock
// Import modules - they auto-register in Highcharts 12.4.0+
import 'highcharts/modules/accessibility';
import 'highcharts/modules/boost';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/offline-exporting';
import { buoyDataDirectionVariant, colors, directionColors, VariantReadableName } from './config';
import type {
  AnimationConfig,
  NavigatorConfig,
  RangeSelectorConfig,
  ScrollbarConfig,
  SeriesData,
  ThemeConfig,
} from './type';

export const DEFAULT_THEME = {
  colors: [
    '#7cb5ec',
    '#434348',
    '#90ed7d',
    '#f7a35c',
    '#8085e9',
    '#f15c80',
    '#e4d354',
    '#2b908f',
    '#f45b5b',
    '#91e8e1',
  ],
  backgroundColor: 'transparent',
  textColor: '#333333',
  gridColor: '#e6e6e6',
  lineColor: '#ccd6eb',
};

export const initializeHighchartsModules = () => {
  // Modules auto-register when imported in Highcharts 12.4.0+
  // This function is kept for backwards compatibility but does nothing
};

export const buildRangeSelectorConfig = (
  rangeSelector?: RangeSelectorConfig,
  theme?: ThemeConfig,
) => {
  if (!rangeSelector?.enabled) {
    return { enabled: false };
  }

  const defaultButtons = [
    { type: 'day' as const, count: 7, text: '7d' },
    { type: 'day' as const, count: 30, text: '30d' },
    { type: 'month' as const, count: 3, text: '3m' },
    { type: 'month' as const, count: 6, text: '6m' },
    { type: 'year' as const, count: 1, text: '1y' },
    { type: 'all' as const, text: 'All' },
  ];

  return {
    enabled: true,
    selected: rangeSelector.selected || 1,
    buttons: rangeSelector.buttons || defaultButtons,
    inputEnabled: rangeSelector.inputEnabled !== false,

    inputBoxBorderColor:
      rangeSelector.inputBoxBorderColor || theme?.lineColor || DEFAULT_THEME.lineColor,
    inputBoxWidth: rangeSelector.inputBoxWidth || 120,
    inputBoxHeight: rangeSelector.inputBoxHeight || 20,
    inputStyle: rangeSelector.inputStyle || {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      background: 'white',
      border: '1px solid #cccccc',
      zIndex: 10,
      opacity: 1,
    },
    inputDateFormat: rangeSelector.inputDateFormat || '%Y-%m-%d',
    inputEditDateFormat: rangeSelector.inputEditDateFormat || '%Y-%m-%d',
    floating: rangeSelector.floating || false,
    y: rangeSelector.y || 0,
    height: rangeSelector.height || 35,
    labelStyle: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontWeight: 'bold',
    },

    buttonTheme: {
      fill: theme?.backgroundColor || 'none',
      stroke: theme?.lineColor || DEFAULT_THEME.lineColor,
      'stroke-width': 1,
      zIndex: 7,
      style: {
        color: theme?.textColor || DEFAULT_THEME.textColor,
        fontWeight: 'normal',
      },
      states: {
        hover: {
          fill: theme?.gridColor || '#f0f0f0',
          style: {
            color: theme?.textColor || DEFAULT_THEME.textColor,
          },
        },
        select: {
          fill: theme?.lineColor || DEFAULT_THEME.lineColor,
          style: {
            color: '#ffffff',
          },
        },
      },
    },
  };
};

export const buildNavigatorConfig = (navigator?: NavigatorConfig, theme?: ThemeConfig) => {
  if (!navigator?.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    height: navigator.height || 40,
    margin: navigator.margin || 25,
    maskFill: navigator.maskFill || 'rgba(102, 133, 194, 0.3)',
    outlineColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    outlineWidth: 1,
    handles: {
      backgroundColor: theme?.backgroundColor || '#f2f2f2',
      borderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    },
    xAxis: {
      gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
      labels: {
        style: {
          color: theme?.textColor || '#666666',
          fontSize: '10px',
        },
      },
    },
    yAxis: {
      gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    },
    series: {
      color: theme?.colors?.[0] || DEFAULT_THEME.colors[0],
      fillOpacity: 0.05,
      lineWidth: 1,
    },
  };
};

export const buildScrollbarConfig = (scrollbar?: ScrollbarConfig, theme?: ThemeConfig) => {
  if (!scrollbar?.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    height: scrollbar.height || 20,
    barBackgroundColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    barBorderRadius: 7,
    barBorderWidth: 0,
    buttonBackgroundColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    buttonBorderWidth: 0,
    buttonBorderRadius: 7,
    trackBackgroundColor: 'none',
    trackBorderWidth: 1,
    trackBorderRadius: 8,
    trackBorderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
  };
};

// Rest of your existing utility functions remain the same...
export const sanitizeMarker = (
  marker?: Highcharts.PointMarkerOptionsObject,
): Highcharts.PointMarkerOptionsObject | undefined => {
  if (!marker) return undefined;

  const validSymbols = ['circle', 'square', 'diamond', 'triangle', 'triangle-down'];

  return {
    ...marker,
    symbol:
      marker.symbol && validSymbols.includes(marker.symbol as string) ? marker.symbol : 'circle',
    enabled: marker.enabled !== false,
    radius: typeof marker.radius === 'number' ? marker.radius : 4,
  };
};

export const processSeries = (
  series: SeriesData[],
  themedColors: string[],
  onPointClick?: (point: Highcharts.Point) => void,
  onSeriesClick?: (series: Highcharts.Series) => void,
): Highcharts.SeriesOptionsType[] => {
  return series.map((s, index) => {
    const seriesConfig: any = {
      type: s.type || 'line',
      name: s.name,
      data: s.data,
      color: s.color || themedColors[index % themedColors.length],
      lineWidth: s.lineWidth,
      dashStyle: s.dashStyle,
      visible: s.visible !== false,
      showInLegend: s.showInLegend !== false,
      yAxis: s.yAxis || 0,
      zIndex: s.zIndex,
    };

    if (s.marker) {
      const sanitizedMarker = sanitizeMarker(s.marker);
      if (sanitizedMarker) {
        seriesConfig.marker = sanitizedMarker;
      }
    }

    if (onPointClick || onSeriesClick) {
      if (onPointClick) {
        seriesConfig.point = {
          events: {
            click: function (this: Highcharts.Point) {
              onPointClick(this);
            },
          },
        };
      }

      if (onSeriesClick) {
        seriesConfig.events = {
          click: function (this: Highcharts.Series) {
            onSeriesClick(this);
          },
        };
      }
    }

    return seriesConfig;
  });
};

export const buildChartConfig = (
  width: string | number,
  height: string | number,
  zoomType: string | undefined,
  panKey: string,
  panning: boolean,
  animation: AnimationConfig,
  theme: ThemeConfig | undefined,
  rangeSelector?: RangeSelectorConfig,
  onChartLoad?: (chart: Highcharts.Chart) => void,
  onRedraw?: () => void,
): Highcharts.ChartOptions => ({
  type: 'line',
  backgroundColor: theme?.backgroundColor || DEFAULT_THEME.backgroundColor,
  width: typeof width === 'number' ? width : undefined,
  height: typeof height === 'number' ? height : undefined,
  panKey: panKey as any,
  panning: panning ? { enabled: true } : undefined,
  animation: animation.enabled
    ? {
        duration: animation.duration,
        easing: animation.easing as any,
      }
    : false,
  events: {
    load: function () {
      onChartLoad?.(this);
    },
    redraw: onRedraw,
  },
  // Improved margin calculations for range selector
  marginTop: rangeSelector?.enabled ? 100 : undefined, // Increased from 80
  marginBottom: 120, // Add bottom margin for navigator
  spacing: [10, 10, 15, 10], // [top, right, bottom, left] spacing
  ...(zoomType ? { zoomType: zoomType as any } : {}),
});
export const buildTitleConfig = (
  title: string,
  subtitle: string | undefined,
  theme: ThemeConfig | undefined,
) => ({
  title: {
    text: title,
    useHTML: true,
    style: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
    },
  },
  subtitle: subtitle
    ? {
        text: subtitle,
        style: {
          color: theme?.textColor || '#666666',
        },
      }
    : undefined,
});

export const buildAxisConfig = (axis: any, theme: ThemeConfig | undefined) => {
  const defaultAxis = {
    gridLineColor: theme?.gridColor || DEFAULT_THEME.gridColor,
    lineColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    tickColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    labels: {
      style: {
        color: theme?.textColor || '#666666',
      },
    },
    title: {
      style: {
        color: theme?.textColor || DEFAULT_THEME.textColor,
      },
    },
  };

  if (Array.isArray(axis)) {
    return axis.map(a => ({ ...defaultAxis, ...a }));
  }

  return axis ? [{ ...defaultAxis, ...axis }] : [defaultAxis];
};

export const buildTooltipConfig = (tooltip: any, theme: ThemeConfig | undefined) => {
  const { customFormatter, ...otherTooltipProps } = tooltip || {};

  return {
    shared: true,
    useHTML: true,
    backgroundColor: theme?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
    borderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    style: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
    },
    formatter: customFormatter
      ? function (this: any) {
          return customFormatter(this);
        }
      : undefined,
    ...otherTooltipProps,
  };
};

export const buildLegendConfig = (legend: any, theme: ThemeConfig | undefined) => ({
  itemStyle: {
    color: theme?.textColor || DEFAULT_THEME.textColor,
  },
  itemHoverStyle: {
    color: theme?.textColor || '#000000',
  },
  ...legend,
});

export const buildPlotOptionsConfig = (
  animation: AnimationConfig,
  turboThreshold: number,
  boost: boolean,
  plotOptions: any,
) => ({
  series: {
    animation: animation.enabled
      ? {
          duration: animation.duration,
        }
      : false,
    turboThreshold,
    boost: boost
      ? {
          enabled: true,
          useGPUTranslations: true,
        }
      : undefined,
    marker: {
      enabled: true,
      symbol: 'circle',
      radius: 4,
    },
    ...plotOptions?.series,
  },
  ...plotOptions,
});

export const buildExportingConfig = (exportingConfig: any) => {
  if (!exportingConfig.enabled) {
    return { enabled: false };
  }

  const defaultMenuItems = [
    'downloadPNG',
    // 'downloadJPEG',
    // 'downloadPDF',
    // 'downloadSVG',
    // 'separator',
    'downloadCSV',
    'downloadXLS',
  ];

  const filename = exportingConfig.filename || 'chart';
  const watermarkUrl: string | undefined = exportingConfig.watermarkUrl;

  const makeDownloadHandler = (mimeType: string, ext: string) =>
    function (this: any) {
      const width = this.chartWidth;
      const height = this.chartHeight;
      const scale = 2;

      const svg = this.getSVG({ chart: { width, height } });
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const triggerDownload = () => {
        canvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, mimeType);
      };

      const drawWatermark = (onDone: () => void) => {
        if (!watermarkUrl) return onDone();
        const logo = new Image();
        logo.onload = () => {
          const logoH = 56;
          const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
          const padding = 12;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(logo, 0, padding / 2, logoW, logoH);
          ctx.globalAlpha = 1;
          onDone();
        };
        logo.onerror = onDone;
        logo.src = watermarkUrl;
      };

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const chartImg = new Image();
      chartImg.onload = () => {
        ctx.drawImage(chartImg, 0, 0);
        URL.revokeObjectURL(svgUrl);
        drawWatermark(triggerDownload);
      };
      chartImg.src = svgUrl;
    };

  return {
    enabled: true,
    filename,
    fallbackToExportServer: false,
    scale: 2,
    chartOptions: {
      plotOptions: {
        series: {
          dataLabels: {
            enabled: false,
          },
        },
      },
    },
    menuItemDefinitions: {
      downloadPNG: { textKey: 'downloadPNG', onclick: makeDownloadHandler('image/png', 'png') },
      downloadJPEG: { textKey: 'downloadJPEG', onclick: makeDownloadHandler('image/jpeg', 'jpg') },
    },
    buttons: exportingConfig.buttons || {
      contextButton: {
        menuItems: exportingConfig.formats
          ? exportingConfig.formats.map(
              (format: string) =>
                defaultMenuItems.find(item => item.toLowerCase().includes(format)) || 'downloadPNG',
            )
          : defaultMenuItems,
      },
    },
  };
};

// Export utilities
export const exportFallbacks = {
  svg: (chart: Highcharts.Chart, filename: string) => {
    try {
      const svg = (chart as any).getSVG({ chart: { backgroundColor: '#ffffff' } });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, `${filename}.svg`);
    } catch (error) {
      console.error('SVG export fallback failed:', error);
    }
  },

  png: (chart: Highcharts.Chart, filename: string) => {
    try {
      const svg = (chart as any).getSVG({ chart: { backgroundColor: '#ffffff' } });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          if (blob) downloadBlob(blob, `${filename}.png`);
        }, 'image/png');
      };

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
      console.error('PNG export fallback failed:', error);
    }
  },

  jpeg: (chart: Highcharts.Chart, filename: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const svg = (chart as any).getSVG({
          chart: { backgroundColor: '#ffffff' },
          exporting: { sourceWidth: 800, sourceHeight: 600 },
        });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        const img = new Image();

        img.onload = () => {
          try {
            canvas.width = img.naturalWidth || 800;
            canvas.height = img.naturalHeight || 600;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              blob => {
                if (blob) {
                  downloadBlob(blob, `${filename}.jpg`);
                  resolve();
                } else {
                  reject(new Error('Failed to create JPEG blob'));
                }
              },
              'image/jpeg',
              0.9,
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load SVG as image'));

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        img.src = URL.createObjectURL(svgBlob);
      } catch (error) {
        reject(error);
      }
    });
  },

  pdf: (chart: Highcharts.Chart, filename: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const svg = (chart as any).getSVG({
          chart: { backgroundColor: '#ffffff' },
          exporting: { sourceWidth: 1200, sourceHeight: 800 },
        });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        const img = new Image();

        img.onload = () => {
          try {
            canvas.width = img.naturalWidth || 1200;
            canvas.height = img.naturalHeight || 800;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(blob => {
              if (blob) {
                downloadBlob(blob, `${filename}.png`);
                console.warn('PDF saved as PNG. Install jsPDF for proper PDF export.');
                resolve();
              } else {
                reject(new Error('Failed to create PDF blob'));
              }
            }, 'image/png');
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load SVG as image'));

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        img.src = URL.createObjectURL(svgBlob);
      } catch (error) {
        reject(error);
      }
    });
  },
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const calculateDateRange = (seriesData: any[]) => {
  if (!seriesData || seriesData.length === 0) return { min: null, max: null };

  let minDate = Infinity;
  let maxDate = -Infinity;

  seriesData.forEach(series => {
    if (series.data && series.data.length > 0) {
      const firstPoint = series.data[0][0]; // First timestamp
      const lastPoint = series.data[series.data.length - 1][0]; // Last timestamp

      minDate = Math.min(minDate, firstPoint);
      maxDate = Math.max(maxDate, lastPoint);
    }
  });

  return {
    min: minDate === Infinity ? null : minDate,
    max: maxDate === -Infinity ? null : maxDate,
  };
};

export function generateSeriesStyles(viriants: string[]): Partial<SeriesData>[] {
  return viriants.map((v, _index) => ({
    name: v,
    // color: colors[index % colors.length],
    //TODO: temp set to same color.
    color: colors[0],
    type: 'line',
    lineWidth: 2,
    marker: {
      enabled: true,
      radius: 2,
      symbol: 'circle',
    },
  }));
}

export function createDirectionArrow(
  direction: number,
  color: string = directionColors.direction,
): string {
  // Wave direction: direction FROM which waves are coming
  // 0° = North, 90° = East, 180° = South, 270° = West (clockwise positive)
  // Arrow points in the direction the waves are traveling TO (opposite of source)

  const arrowDirection = direction + 180; // Point where waves are going TO

  const arrowSvg = `
     <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${arrowDirection} 16 16)">
        <rect x="14.5" y="8" width="3" height="16" fill="${color}"/>
        <path d="M16 4 L24 12 L20 12 L16 8 L12 12 L8 12 Z" fill="${color}"/>
      </g>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(arrowSvg);
}

export function processDirectionData(data: BuoyItemContent): SeriesData | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // Fixed position: 10% from bottom of chart (adjust as needed)
  const arrowYPosition = -0.1;

  const processedData = data.map(point => {
    const [timestamp, direction] = point as [number, number];
    return {
      x: timestamp,
      y: arrowYPosition,
      direction: direction,
      marker: {
        symbol: `url(${createDirectionArrow(direction)})`,
      },
    };
  });

  return {
    name:
      buoyDataDirectionVariant in VariantReadableName
        ? VariantReadableName[buoyDataDirectionVariant]
        : buoyDataDirectionVariant,
    type: 'scatter',
    data: processedData,
    color: directionColors.direction,
    marker: {
      enabled: true,
      radius: 10,
      symbol: 'circle',
    },
    zIndex: 1, // Below data lines
    yAxis: 1, // Secondary axis
    showInLegend: true,
  };
}

export function calculateDataRange(seriesData: SeriesData[]) {
  if (!seriesData?.length) return null;

  let allTimestamps: number[] = [];

  // Collect all timestamps from all series
  seriesData.forEach(series => {
    if (series.data?.length) {
      const timestamps = series.data
        .map(point => {
          if (Array.isArray(point)) {
            return point[0];
          } else if (typeof point === 'object' && point !== null && 'x' in point) {
            return (point as { x: number }).x;
          }
          return undefined;
        })
        .filter((t): t is number => typeof t === 'number');
      allTimestamps = allTimestamps.concat(timestamps);
    }
  });

  if (!allTimestamps.length) return null;

  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const rangeDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);

  return {
    minTime,
    maxTime,
    rangeDays,
    rangeHours: rangeDays * 24,
  };
}

type RangeSelectorButtonType =
  | 'all'
  | 'hour'
  | 'day'
  | 'month'
  | 'year'
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'week';

export function generateDynamicButtons(dataRange: ReturnType<typeof calculateDataRange>) {
  if (!dataRange) return [{ type: 'all' as RangeSelectorButtonType, text: 'All' }];

  const { rangeDays, rangeHours } = dataRange;
  const buttons: { type: RangeSelectorButtonType; count?: number; text: string }[] = [];

  // Add hour-based buttons for short ranges
  if (rangeHours >= 6) {
    buttons.push({ type: 'hour', count: 6, text: '6H' });
  }
  if (rangeHours >= 12) {
    buttons.push({ type: 'hour', count: 12, text: '12H' });
  }
  if (rangeHours >= 24) {
    buttons.push({ type: 'day', count: 1, text: '24H' });
  }

  // Add day-based buttons
  if (rangeDays >= 3) {
    buttons.push({ type: 'day', count: 3, text: '3D' });
  }
  if (rangeDays >= 7) {
    buttons.push({ type: 'day', count: 7, text: '1W' });
  }
  if (rangeDays >= 14) {
    buttons.push({ type: 'day', count: 14, text: '2W' });
  }

  // Add month-based buttons for longer ranges
  if (rangeDays >= 30) {
    buttons.push({ type: 'month', count: 1, text: '1M' });
  }
  if (rangeDays >= 90) {
    buttons.push({ type: 'month', count: 3, text: '3M' });
  }
  if (rangeDays >= 180) {
    buttons.push({ type: 'month', count: 6, text: '6M' });
  }
  if (rangeDays >= 365) {
    buttons.push({ type: 'year', count: 1, text: '1Y' });
  }

  // Always add "All" button
  buttons.push({ type: 'all', text: 'All' });

  return buttons;
}
