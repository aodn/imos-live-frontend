import accessibility from 'highcharts/modules/accessibility';
import {
  AnimationConfig,
  NavigatorConfig,
  RangeSelectorConfig,
  ScrollbarConfig,
  SeriesData,
  ThemeConfig,
} from './type';
import exporting from 'highcharts/modules/exporting';
import Highcharts from 'highcharts/highstock'; // Use highstock
import boost from 'highcharts/modules/boost';
import exportData from 'highcharts/modules/export-data';
import offlineExporting from 'highcharts/modules/offline-exporting';

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
  [accessibility, boost, exporting, exportData, offlineExporting].forEach(module => {
    if (typeof module === 'function') {
      module(Highcharts);
    }
  });
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
    inputBoxBorderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
    inputBoxWidth: rangeSelector.inputBoxWidth || 120,
    inputBoxHeight: rangeSelector.inputBoxHeight || 18,
    inputStyle: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontWeight: 'normal',
    },
    labelStyle: {
      color: theme?.textColor || DEFAULT_THEME.textColor,
      fontWeight: 'bold',
    },
    buttonTheme: {
      fill: theme?.backgroundColor || 'none',
      stroke: theme?.lineColor || DEFAULT_THEME.lineColor,
      'stroke-width': 1,
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
  marginTop: rangeSelector?.enabled ? 80 : undefined,
  ...(zoomType ? { zoomType: zoomType as any } : {}),
});

export const buildTitleConfig = (
  title: string,
  subtitle: string | undefined,
  theme: ThemeConfig | undefined,
) => ({
  title: {
    text: title,
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

export const buildTooltipConfig = (tooltip: any, theme: ThemeConfig | undefined) => ({
  shared: true,
  backgroundColor: theme?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
  borderColor: theme?.lineColor || DEFAULT_THEME.lineColor,
  style: {
    color: theme?.textColor || DEFAULT_THEME.textColor,
  },
  formatter: tooltip?.customFormatter
    ? function (this: any) {
        return tooltip.customFormatter!(this);
      }
    : undefined,
  ...tooltip,
});

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
    'downloadJPEG',
    'downloadPDF',
    'downloadSVG',
    'separator',
    'downloadCSV',
    'downloadXLS',
  ];

  return {
    enabled: true,
    filename: exportingConfig.filename || 'chart',
    fallbackToExportServer: false,
    sourceWidth: 800,
    sourceHeight: 600,
    scale: 1,
    chartOptions: {
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
          },
        },
      },
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
      const svg = chart.getSVG({ chart: { backgroundColor: '#ffffff' } });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      downloadBlob(blob, `${filename}.svg`);
    } catch (error) {
      console.error('SVG export fallback failed:', error);
    }
  },

  png: (chart: Highcharts.Chart, filename: string) => {
    try {
      const svg = chart.getSVG({ chart: { backgroundColor: '#ffffff' } });
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
        const svg = chart.getSVG({
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
        const svg = chart.getSVG({
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
