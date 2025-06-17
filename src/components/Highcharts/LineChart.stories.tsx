import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';
import React, { useRef } from 'react';
import { LineChartExposedMethods } from './type';

// Sample data generators
const generateSampleData = (points: number = 10, variance: number = 50) => {
  return Array.from({ length: points }, (_, i) => ({
    x: i,
    y: Math.random() * variance + 20,
  }));
};

const generateTimeSeriesData = (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return Array.from({ length: days }, (_, i) => ({
    x: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).getTime(),
    y: Math.random() * 100 + 50 + Math.sin(i * 0.1) * 20,
  }));
};

const meta: Meta<typeof LineChart> = {
  title: 'Components/Charts/LineChart',
  component: LineChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    width: { control: { type: 'range', min: 300, max: 1200, step: 50 } },
    height: { control: { type: 'range', min: 200, max: 800, step: 50 } },
    responsive: { control: 'boolean' },
    boost: { control: 'boolean' },
    panning: { control: 'boolean' },
    zoomType: {
      control: 'select',
      options: ['x', 'y', 'xy', undefined],
    },
    panKey: {
      control: 'select',
      options: ['alt', 'ctrl', 'meta', 'shift'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Stories
export const Default: Story = {
  args: {
    title: 'Basic Line Chart',
    subtitle: 'Simple line chart with default settings',
    width: 800,
    height: 400,
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          enabled: true,
        },
      },
    },
    series: [
      {
        name: 'Sample Data',
        data: [10, 25, 15, 30, 20, 35, 25, 40, 30, 45],
        type: 'line',
      },
    ],
  },
};

export const WithoutContextMenu: Story = {
  args: {
    title: 'Basic Line Chart',
    subtitle: 'Simple line chart with default settings',
    width: 800,
    height: 400,
    exporting: {
      enabled: false,
    },
    series: [
      {
        name: 'Sample Data',
        data: [10, 25, 15, 30, 20, 35, 25, 40, 30, 45],
        type: 'line',
      },
    ],
  },
};

export const MultiSeries: Story = {
  args: {
    title: 'Multi-Series Line Chart',
    subtitle: 'Multiple data series with different colors',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Revenue',
        data: generateSampleData(12, 100),
        color: '#2563eb',
        type: 'line',
        lineWidth: 3,
      },
      {
        name: 'Expenses',
        data: generateSampleData(12, 80),
        color: '#dc2626',
        type: 'line',
        lineWidth: 2,
        dashStyle: 'Dash',
      },
      {
        name: 'Profit',
        data: generateSampleData(12, 60),
        color: '#16a34a',
        type: 'spline',
        lineWidth: 2,
      },
    ],
  },
};

export const TimeSeriesChart: Story = {
  args: {
    title: 'Time Series Data',
    subtitle: 'Chart with datetime x-axis',
    width: 900,
    height: 450,
    series: [
      {
        name: 'Stock Price',
        data: generateTimeSeriesData(60),
        color: '#8b5cf6',
        type: 'spline',
        lineWidth: 2,
      },
    ],
    xAxis: {
      type: 'datetime',
      title: { text: 'Date' },
      labels: {
        format: '{value:%b %e}',
      },
    },
    yAxis: {
      title: { text: 'Price ($)' },
      labels: {
        format: '${value}',
      },
    },
  },
};

// Styling Stories
export const DarkTheme: Story = {
  args: {
    title: 'Dark Theme Chart',
    subtitle: 'Chart with dark theme styling',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Data Series 1',
        data: generateSampleData(15, 50),
        color: '#60a5fa',
        type: 'line',
      },
      {
        name: 'Data Series 2',
        data: generateSampleData(15, 60),
        color: '#34d399',
        type: 'line',
      },
    ],
    theme: {
      backgroundColor: '#1f2937',
      textColor: '#f9fafb',
      gridColor: '#374151',
      lineColor: '#6b7280',
      colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
    },
  },
};

export const CustomColors: Story = {
  args: {
    title: 'Custom Color Palette',
    subtitle: 'Chart with custom color scheme',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Series A',
        data: generateSampleData(10, 40),
        color: '#ff6b6b',
        type: 'line',
      },
      {
        name: 'Series B',
        data: generateSampleData(10, 35),
        color: '#4ecdc4',
        type: 'line',
      },
      {
        name: 'Series C',
        data: generateSampleData(10, 45),
        color: '#45b7d1',
        type: 'line',
      },
    ],
    theme: {
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
    },
  },
};

// Chart Types
export const MixedTypes: Story = {
  args: {
    title: 'Mixed Chart Types',
    subtitle: 'Combining different chart types',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Line Series',
        data: generateSampleData(12, 50),
        type: 'line',
        color: '#3b82f6',
      },
      {
        name: 'Spline Series',
        data: generateSampleData(12, 40),
        type: 'spline',
        color: '#ef4444',
      },
      {
        name: 'Area Series',
        data: generateSampleData(12, 30),
        type: 'area',
        color: '#10b981',
      },
    ],
  },
};

export const ScatterPlot: Story = {
  args: {
    title: 'Scatter Plot',
    subtitle: 'Data points without connecting lines',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Scatter Data',
        data: Array.from({ length: 50 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
        })),
        type: 'scatter',
        color: '#8b5cf6',
        marker: {
          radius: 5,
          symbol: 'circle',
        },
      },
    ],
  },
};

// Interactive Features
export const ZoomableChart: Story = {
  args: {
    title: 'Zoomable Chart',
    subtitle: 'Drag to zoom, shift+drag to pan',
    width: 800,
    height: 400,
    zoomType: 'xy',
    panning: true,
    panKey: 'shift',
    series: [
      {
        name: 'Large Dataset',
        data: generateSampleData(100, 80),
        type: 'line',
        color: '#06b6d4',
      },
    ],
  },
};

export const WithMarkers: Story = {
  args: {
    title: 'Chart with Custom Markers',
    subtitle: 'Different marker styles for each series',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Circle Markers',
        data: generateSampleData(8, 50),
        type: 'line',
        color: '#f59e0b',
        marker: {
          symbol: 'circle',
          radius: 6,
          enabled: true,
        },
      },
      {
        name: 'Square Markers',
        data: generateSampleData(8, 40),
        type: 'line',
        color: '#8b5cf6',
        marker: {
          symbol: 'square',
          radius: 5,
          enabled: true,
        },
      },
      {
        name: 'Diamond Markers',
        data: generateSampleData(8, 45),
        type: 'line',
        color: '#ef4444',
        marker: {
          symbol: 'diamond',
          radius: 7,
          enabled: true,
        },
      },
    ],
  },
};

// Animation Stories
export const AnimatedChart: Story = {
  args: {
    title: 'Animated Chart',
    subtitle: 'Chart with custom animation settings',
    width: 800,
    height: 400,
    animation: {
      enabled: true,
      duration: 2000,
      easing: 'easeOutBounce',
    },
    series: [
      {
        name: 'Animated Series',
        data: generateSampleData(12, 60),
        type: 'spline',
        color: '#10b981',
        lineWidth: 3,
      },
    ],
  },
};

export const NoAnimation: Story = {
  args: {
    title: 'No Animation',
    subtitle: 'Chart with animations disabled',
    width: 800,
    height: 400,
    animation: {
      enabled: false,
    },
    series: [
      {
        name: 'Static Series',
        data: generateSampleData(12, 60),
        type: 'line',
        color: '#dc2626',
      },
    ],
  },
};

// Performance Stories
export const HighPerformance: Story = {
  args: {
    title: 'High Performance Chart',
    subtitle: 'Large dataset with boost enabled',
    width: 800,
    height: 400,
    boost: true,
    turboThreshold: 500,
    series: [
      {
        name: 'Large Dataset',
        data: generateSampleData(2000, 100),
        type: 'line',
        color: '#f59e0b',
        lineWidth: 1,
      },
    ],
  },
};

// Dual Axis
export const DualAxis: Story = {
  args: {
    title: 'Dual Y-Axis Chart',
    subtitle: 'Two different scales on left and right',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Temperature (°C)',
        data: Array.from({ length: 12 }, (_, i) => 15 + Math.sin(i * 0.5) * 10),
        type: 'line',
        color: '#ef4444',
        yAxis: 0,
      },
      {
        name: 'Rainfall (mm)',
        data: Array.from({ length: 12 }, () => Math.random() * 200 + 50),
        type: 'column',
        color: '#3b82f6',
        yAxis: 1,
      },
    ],
    yAxis: [
      {
        title: { text: 'Temperature (°C)' },
        labels: { format: '{value}°C' },
      },
      {
        title: { text: 'Rainfall (mm)' },
        labels: { format: '{value}mm' },
        opposite: true,
      },
    ],
  },
};

// Custom Tooltip
export const CustomTooltip: Story = {
  args: {
    title: 'Custom Tooltip',
    subtitle: 'Chart with custom tooltip formatting',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Sales Data',
        data: generateSampleData(12, 1000),
        type: 'line',
        color: '#10b981',
      },
    ],
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      style: { color: '#ffffff' },
      borderColor: '#10b981',
      borderRadius: 8,
      customFormatter: function (point: any) {
        const value = typeof point.y === 'number' ? point.y : 0;
        const xValue = typeof point.x === 'number' ? point.x : point.point?.index || 0;
        return `<b>${point.series.name}</b><br/>
                Value: ${value.toFixed(2)}<br/>
                Point: ${xValue}`;
      },
    },
  },
};

// Export Configuration
export const ExportEnabled: Story = {
  args: {
    title: 'Chart with Export Options',
    subtitle: 'Click the menu button to export',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Exportable Data',
        data: generateSampleData(12, 50),
        type: 'line',
        color: '#8b5cf6',
      },
    ],
    exporting: {
      enabled: true,
      filename: 'my-chart',
      formats: ['png', 'jpeg', 'pdf', 'svg'],
    },
  },
};

// Error Handling
export const EmptyData: Story = {
  args: {
    title: 'Chart with Empty Data',
    subtitle: 'Handling empty datasets gracefully',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Empty Series',
        data: [],
        type: 'line',
        color: '#6b7280',
      },
    ],
  },
};

// Advanced Styling
export const GradientChart: Story = {
  args: {
    title: 'Gradient Styled Chart',
    subtitle: 'Chart with gradient background and styling',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Gradient Series',
        data: generateSampleData(15, 60),
        type: 'area',
        color: '#3b82f6',
      },
    ],
    theme: {
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      gridColor: 'rgba(59, 130, 246, 0.2)',
      lineColor: 'rgba(59, 130, 246, 0.3)',
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    },
  },
};

// Playground Story for testing
export const Playground: Story = {
  args: {
    title: 'Interactive Playground',
    subtitle: 'Experiment with different settings',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Primary Series',
        data: generateSampleData(12, 50),
        type: 'line',
        color: '#3b82f6',
      },
      {
        name: 'Secondary Series',
        data: generateSampleData(12, 40),
        type: 'line',
        color: '#10b981',
      },
    ],
    responsive: true,
    boost: false,
    panning: false,
    zoomType: undefined,
    animation: {
      enabled: true,
      duration: 1000,
    },
  },
};

export const BasicCustomButton: Story = {
  args: {
    title: 'Basic Custom Export Button',
    subtitle: 'Simple button styling',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Sample Data',
        data: [10, 25, 15, 30, 20, 35, 25, 40, 30, 45],
        type: 'line',
        color: '#3b82f6',
      },
    ],
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          // Button positioning
          x: -10,
          y: 10,

          // Button appearance
          symbol: 'menu', // Options: 'menu', 'download', 'hamburger', etc.
          symbolFill: '#666',
          symbolStroke: '#333',
          symbolStrokeWidth: 1,

          // Button theme/styling
          theme: {
            fill: '#f8f9fa', // Background color
            stroke: '#dee2e6', // Border color
            'stroke-width': 1, // Border width
            r: 4, // Border radius
            padding: 8, // Internal padding

            // Hover state
            states: {
              hover: {
                fill: '#e9ecef',
                stroke: '#adb5bd',
              },
              select: {
                fill: '#6c757d',
                stroke: '#495057',
              },
            },
          },

          // Menu items
          menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG'],
        },
      },
    },
  },
};

// Method 3: Custom Icon Button
export const CustomIconButton: Story = {
  args: {
    title: 'Custom Icon Export Button',
    subtitle: 'Using custom SVG path for icon',
    width: 800,
    height: 400,
    series: [
      {
        name: 'Sample Data',
        data: [10, 25, 15, 30, 20, 35, 25, 40, 30, 45],
        type: 'line',
        color: '#f59e0b',
      },
    ],
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          // Custom SVG path for download icon
          symbol: 'M12 16l-4-4h3V4h2v8h3l-4 4zm-8 2v2h16v-2H4z',
          symbolFill: '#ffffff',
          symbolStroke: 'none',

          theme: {
            fill: '#f59e0b',
            stroke: '#d97706',
            'stroke-width': 1,
            r: 6,
            padding: 8,
            width: 32,
            height: 32,

            states: {
              hover: {
                fill: '#d97706',
                stroke: '#b45309',
              },
            },
          },
        },
      },
    },
  },
};

// Method 6: Completely Custom React Button Component
export const ReactCustomButton = () => {
  const chartRef = useRef<LineChartExposedMethods>(null!);
  const [isExporting, setIsExporting] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleExport = async (format: 'png' | 'jpeg' | 'pdf' | 'svg') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      chartRef.current?.exportChart(format, `chart-${Date.now()}`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Custom Export Button */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isExporting}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              opacity: isExporting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isExporting ? 'Exporting...' : '📥 Export'}
          </button>

          {/* Custom Dropdown Menu */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minWidth: '160px',
                zIndex: 1001,
              }}
            >
              {[
                { format: 'png' as const, label: '📷 PNG Image', color: '#10b981' },
                { format: 'jpeg' as const, label: '🖼️ JPEG Image', color: '#f59e0b' },
                { format: 'pdf' as const, label: '📄 PDF Document', color: '#ef4444' },
                { format: 'svg' as const, label: '🎨 SVG Vector', color: '#8b5cf6' },
              ].map(({ format, label, color }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.color = color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <button
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowMenu(false)}
        />
      )}

      <LineChart
        ref={chartRef}
        title="Chart with Custom React Export Button"
        subtitle="Modern custom export controls"
        width={800}
        height={400}
        series={[
          {
            name: 'Sample Data',
            data: [10, 25, 15, 30, 20, 35, 25, 40, 30, 45],
            type: 'line',
            color: '#3b82f6',
          },
        ]}
      />
    </div>
  );
};
