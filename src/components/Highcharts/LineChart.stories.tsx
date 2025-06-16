import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A highly customizable and performant LineChart component built on Highcharts with full TypeScript support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Chart title',
    },
    subtitle: {
      control: 'text',
      description: 'Chart subtitle',
    },
    width: {
      control: { type: 'range', min: 300, max: 1200, step: 50 },
      description: 'Chart width',
    },
    height: {
      control: { type: 'range', min: 200, max: 800, step: 50 },
      description: 'Chart height',
    },
    responsive: {
      control: 'boolean',
      description: 'Enable responsive behavior',
    },
    zoomType: {
      control: 'select',
      options: ['x', 'y', 'xy', undefined],
      description: 'Enable zooming',
    },
    panning: {
      control: 'boolean',
      description: 'Enable panning',
    },
    boost: {
      control: 'boolean',
      description: 'Enable boost module for large datasets',
    },
    turboThreshold: {
      control: { type: 'range', min: 0, max: 10000, step: 100 },
      description: 'Threshold for enabling turbo mode',
    },
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const basicSeriesData = [
  {
    name: 'Sales',
    data: [10, 15, 12, 18, 20, 17, 22, 25, 23, 28],
  },
  {
    name: 'Profit',
    data: [5, 8, 6, 10, 12, 9, 14, 16, 15, 18],
  },
];

const timeSeriesData = [
  {
    name: 'Temperature',
    data: [
      { x: new Date('2024-01-01').getTime(), y: 20 },
      { x: new Date('2024-02-01').getTime(), y: 22 },
      { x: new Date('2024-03-01').getTime(), y: 25 },
      { x: new Date('2024-04-01').getTime(), y: 28 },
      { x: new Date('2024-05-01').getTime(), y: 32 },
      { x: new Date('2024-06-01').getTime(), y: 35 },
    ],
    color: '#FF6B6B',
    type: 'spline' as const,
  },
];

const multiTypeSeriesData = [
  {
    name: 'Revenue',
    data: [100, 150, 120, 180, 200, 170, 220, 250, 230, 280],
    type: 'area' as const,
    color: '#4ECDC4',
  },
  {
    name: 'Expenses',
    data: [80, 90, 85, 95, 100, 90, 110, 120, 115, 130],
    type: 'line' as const,
    color: '#FF6B6B',
    lineWidth: 3,
  },
  {
    name: 'Targets',
    data: [120, 140, 130, 160, 180, 150, 190, 220, 200, 240],
    type: 'scatter' as const,
    color: '#45B7D1',
  },
];

const darkTheme = {
  backgroundColor: '#000',
  textColor: '#ffffff',
  gridColor: '#404040',
  lineColor: '#666666',
  colors: ['#7cb5ec', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80'],
};

// Basic Story
export const Basic: Story = {
  args: {
    title: 'Basic Line Chart',
    subtitle: 'Simple example with two series',
    series: basicSeriesData,
    width: 600,
    height: 400,
  },
};

// Dark Theme Story
export const DarkTheme: Story = {
  args: {
    title: 'Dark Themed Chart',
    subtitle: 'Chart with dark theme applied',
    series: basicSeriesData,
    theme: darkTheme,
    width: 600,
    height: 400,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// Time Series Story
export const TimeSeries: Story = {
  args: {
    title: 'Time Series Chart',
    subtitle: 'Temperature data over time',
    series: timeSeriesData,
    xAxis: {
      type: 'datetime',
      title: { text: 'Date' },
      dateTimeLabelFormats: {
        month: '%b %Y',
      },
    },
    yAxis: {
      title: { text: 'Temperature (°C)' },
      min: 0,
    },
    width: 700,
    height: 400,
  },
};

// Multiple Chart Types
export const MultipleTypes: Story = {
  args: {
    title: 'Multiple Chart Types',
    subtitle: 'Area, Line, and Scatter in one chart',
    series: multiTypeSeriesData,
    width: 700,
    height: 450,
    legend: {
      layout: 'horizontal',
      align: 'center',
      verticalAlign: 'top',
    },
  },
};

// Zoomable Chart
export const ZoomableChart: Story = {
  args: {
    title: 'Zoomable Chart',
    subtitle: 'Click and drag to zoom, shift+drag to pan',
    series: [
      {
        name: 'Random Data',
        data: Array.from({ length: 100 }, (_, i) => ({
          x: i,
          y: Math.sin(i / 10) * 50 + Math.random() * 20,
        })),
      },
    ],
    zoomType: 'xy',
    panning: true,
    width: 800,
    height: 400,
  },
};

// High Performance Chart
export const HighPerformance: Story = {
  args: {
    title: 'High Performance Chart',
    subtitle: '10,000 data points with boost enabled',
    series: [
      {
        name: 'Big Data',
        data: Array.from({ length: 10000 }, (_, i) => ({
          x: i,
          y: Math.sin(i / 100) * 100 + Math.random() * 20,
        })),
      },
    ],
    boost: true,
    turboThreshold: 0,
    width: 800,
    height: 400,
    animation: { enabled: false },
    tooltip: { enabled: false },
    legend: { enabled: false },
  },
};

// Custom Styling Story
export const CustomStyling: Story = {
  args: {
    title: 'Custom Styled Chart',
    subtitle: 'Chart with custom colors and styling',
    series: [
      {
        name: 'Series A',
        data: [10, 25, 15, 30, 35, 25, 40, 45, 35, 50],
        color: '#E91E63',
        lineWidth: 4,
        type: 'spline',
        marker: {
          enabled: true,
          radius: 6,
          symbol: 'circle',
        },
      },
      {
        name: 'Series B',
        data: [5, 15, 10, 20, 25, 18, 28, 32, 28, 38],
        color: '#9C27B0',
        lineWidth: 2,
        dashStyle: 'Dash',
        marker: {
          enabled: true,
          radius: 4,
          symbol: 'square',
        },
      },
    ],
    theme: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      gridColor: 'rgba(255, 255, 255, 0.2)',
      lineColor: 'rgba(255, 255, 255, 0.3)',
    },
    width: 700,
    height: 400,
    className: 'custom-chart',
    style: {
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
    },
  },
};

// Accessibility Story
export const AccessibilityFocused: Story = {
  args: {
    title: 'Accessibility Focused Chart',
    subtitle: 'Chart optimized for screen readers and keyboard navigation',
    series: basicSeriesData,
    width: 700,
    height: 400,
    accessibility: {
      enabled: true,
      description: 'Chart showing sales and profit data over 10 time periods',
      keyboardNavigation: {
        enabled: true,
      },
      announceNewData: {
        enabled: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chart configured with enhanced accessibility features for better screen reader support.',
      },
    },
  },
};

// Responsive Design Story
export const ResponsiveDesign: Story = {
  args: {
    title: 'Responsive Chart',
    subtitle: 'Resize the viewport to see responsive behavior',
    series: basicSeriesData,
    width: '100%',
    height: 400,
    responsive: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Chart that adapts to different screen sizes automatically.',
      },
    },
  },
};
