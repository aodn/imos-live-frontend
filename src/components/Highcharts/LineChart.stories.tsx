/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';
import Highcharts from 'highcharts';
import { useRef } from 'react';
import { SeriesData } from './type';

// Data generators for different scenarios
const generateTimeSeriesData = (
  days: number = 365,
  baseValue: number = 100,
  volatility: number = 20,
): SeriesData['data'] => {
  const data = [];
  const startDate = new Date('2023-01-01').getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < days; i++) {
    const date = startDate + i * oneDay;
    const trend = baseValue + (i / days) * 50;
    const vol = Math.sin(i / 10) * volatility + Math.random() * volatility - volatility / 2;
    const value = Math.max(0, trend + vol);
    data.push([date, Math.round(value * 100) / 100]);
  }
  return data;
};

const generateCryptoData = (days: number = 180) => {
  const data = [];
  const startDate = new Date('2024-01-01').getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  let price = 50000;

  for (let i = 0; i < days; i++) {
    const date = startDate + i * oneDay;
    const change = (Math.random() - 0.5) * 0.15;
    price = Math.max(1000, price * (1 + change));
    data.push([date, Math.round(price * 100) / 100]);
  }

  return data;
};

const generateMultipleMetrics = () => {
  const revenue = generateTimeSeriesData(365, 1000, 100);
  const profit = revenue.map(point => {
    const [date, value] = point as [number, number];
    return [date, value * 0.3 + Math.random() * 50];
  });
  const users = generateTimeSeriesData(365, 5000, 500);

  return { revenue, profit, users };
};

// Meta configuration
const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart Examples',
  component: LineChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive collection of LineChart examples showcasing various customization options.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'text' } },
    height: { control: { type: 'number', min: 200, max: 800, step: 50 } },
    title: { control: { type: 'text' } },
    subtitle: { control: { type: 'text' } },
    responsive: { control: { type: 'boolean' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LineChart>;

// 1. Basic Financial Dashboard
export const FinancialDashboard: Story = {
  args: {
    title: 'Financial Portfolio Performance',
    subtitle: 'Real-time stock tracking with advanced controls',
    width: '100%',
    height: 600,
    series: [
      {
        name: 'AAPL',
        data: generateTimeSeriesData(365, 150, 25),
        color: '#1f77b4',
        type: 'line',
        lineWidth: 2,
      },
      {
        name: 'GOOGL',
        data: generateTimeSeriesData(365, 120, 20),
        color: '#ff7f0e',
        type: 'line',
        lineWidth: 2,
      },
      {
        name: 'MSFT',
        data: generateTimeSeriesData(365, 180, 15),
        color: '#2ca02c',
        type: 'line',
        lineWidth: 2,
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 3,
      buttons: [
        { type: 'day', count: 7, text: '1W' },
        { type: 'day', count: 30, text: '1M' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'month', count: 6, text: '6M' },
        { type: 'year', count: 1, text: '1Y' },
        { type: 'all', text: 'All' },
      ],
      inputEnabled: true,
    },
    navigator: {
      enabled: true,
      height: 60,
      margin: 30,
    },
    scrollbar: {
      enabled: true,
      height: 25,
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'Date' },
      labels: { format: '{value:%b %e}' },
    },
    yAxis: {
      title: { text: 'Stock Price ($)' },
      labels: { format: '${value}' },
    },
    tooltip: {
      shared: true,
      formatter: function (this: any) {
        let tooltip = `<b>${Highcharts.dateFormat('%A, %b %e, %Y', this.x)}</b><br/>`;
        this.points.forEach((point: any) => {
          tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>$${point.y.toFixed(2)}</b><br/>`;
        });
        return tooltip;
      },
    },
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      gridColor: '#e6e6e6',
      lineColor: '#cccccc',
    },
    onRangeSelect: (min: number, max: number) => {
      console.log('Financial range:', new Date(min), 'to', new Date(max));
    },
  },
};

// 2. Cryptocurrency Trading View
export const CryptoDashboard: Story = {
  args: {
    title: 'Cryptocurrency Price Tracker',
    subtitle: 'Bitcoin price movement with volume indicators',
    width: '100%',
    height: 550,
    series: [
      {
        name: 'Bitcoin Price',
        data: generateCryptoData(180),
        color: '#f7931e',
        type: 'line',
        lineWidth: 3,
        marker: { enabled: false },
      },
      {
        name: 'Moving Average (7d)',
        data: generateCryptoData(180).map(([date, value]) => [date, value * 0.95]),
        color: '#666666',
        type: 'line',
        lineWidth: 1,
        dashStyle: 'Dash',
        marker: { enabled: false },
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 2,
      buttons: [
        { type: 'day', count: 1, text: '24H' },
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'all', text: 'All' },
      ],
      inputEnabled: false,
    },
    navigator: {
      enabled: true,
      height: 40,
      maskFill: 'rgba(247, 147, 30, 0.1)',
    },
    scrollbar: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: { format: '{value:%m/%d}' },
    },
    yAxis: {
      title: { text: 'Price (USD)' },
      labels: { format: '${value:,.0f}' },
      opposite: true,
    },
    theme: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      gridColor: '#333333',
      lineColor: '#555555',
      colors: ['#f7931e', '#666666', '#00d4ff', '#ff6b6b'],
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#f7931e',
      style: { color: '#ffffff' },
      formatter: function (this: any) {
        return `<b>${Highcharts.dateFormat('%b %e, %Y', this.x)}</b><br/>
                <span style="color:${this.points[0].color}">●</span> ${this.points[0].series.name}: 
                <b>$${this.points[0].y.toLocaleString()}</b>`;
      },
    },
  },
};

// 3. Business Metrics Dashboard
export const BusinessMetrics: Story = {
  args: {
    title: 'Business Performance Dashboard',
    subtitle: 'Multi-axis view of key business indicators',
    width: '100%',
    height: 500,
    series: (() => {
      const { revenue, profit, users } = generateMultipleMetrics();
      return [
        {
          name: 'Monthly Revenue',
          data: revenue,
          color: '#2ecc71',
          type: 'column',
          yAxis: 0,
          tooltip: { valueSuffix: 'K' },
        },
        {
          name: 'Net Profit',
          data: profit,
          color: '#3498db',
          type: 'spline',
          yAxis: 0,
          lineWidth: 3,
          tooltip: { valueSuffix: 'K' },
        },
        {
          name: 'Active Users',
          data: users,
          color: '#e74c3c',
          type: 'line',
          yAxis: 1,
          lineWidth: 2,
          dashStyle: 'ShortDot',
          tooltip: { valueSuffix: ' users' },
        },
      ];
    })(),
    rangeSelector: {
      enabled: true,
      selected: 2,
      buttons: [
        { type: 'month', count: 1, text: '1M' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'month', count: 6, text: '6M' },
        { type: 'year', count: 1, text: '1Y' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: { enabled: true, height: 45 },
    scrollbar: { enabled: true },
    xAxis: {
      type: 'datetime',
      title: { text: 'Time Period' },
    },
    yAxis: [
      {
        title: { text: 'Revenue & Profit ($K)', style: { color: '#2ecc71' } },
        labels: { format: '${value}K', style: { color: '#2ecc71' } },
        opposite: false,
      },
      {
        title: { text: 'Active Users', style: { color: '#e74c3c' } },
        labels: { format: '{value}', style: { color: '#e74c3c' } },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      formatter: function (this: any) {
        let tooltip = `<b>${Highcharts.dateFormat('%b %Y', this.x)}</b><br/>`;
        this.points.forEach((point: any) => {
          const suffix = point.series.name.includes('Users') ? ' users' : 'K';
          tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y.toFixed(1)}${suffix}</b><br/>`;
        });
        return tooltip;
      },
    },
    theme: {
      backgroundColor: '#f8f9fa',
      textColor: '#2c3e50',
      gridColor: '#ecf0f1',
      lineColor: '#bdc3c7',
    },
  },
};

// 4. Minimal Clean Design
export const MinimalDesign: Story = {
  args: {
    title: 'Clean Minimal Chart',
    subtitle: 'Simplified design for presentations',
    width: '100%',
    height: 400,
    series: [
      {
        name: 'Growth Trend',
        data: generateTimeSeriesData(90, 100, 5),
        color: '#6c5ce7',
        type: 'spline',
        lineWidth: 3,
        marker: { enabled: false },
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 2,
      inputEnabled: false,
      buttons: [
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    xAxis: {
      type: 'datetime',
      lineWidth: 0,
      tickWidth: 0,
      labels: { style: { fontSize: '12px' } },
    },
    yAxis: {
      gridLineWidth: 1,
      lineWidth: 0,
      tickWidth: 0,
      title: { text: null },
      labels: { style: { fontSize: '12px' } },
    },
    legend: { enabled: false },
    theme: {
      backgroundColor: 'transparent',
      textColor: '#74b9ff',
      gridColor: '#f1f3f4',
      lineColor: '#e0e0e0',
    },
    tooltip: {
      backgroundColor: 'rgba(108, 92, 231, 0.9)',
      borderWidth: 0,
      borderRadius: 8,
      style: { color: '#ffffff', fontSize: '12px' },
    },
  },
};

// 5. Scientific Data Visualization
export const ScientificData: Story = {
  args: {
    title: 'Temperature Monitoring Station',
    subtitle: 'Environmental sensors data with error margins',
    width: '100%',
    height: 500,
    series: [
      {
        name: 'Temperature (°C)',
        data: generateTimeSeriesData(365, 20, 8),
        color: '#e17055',
        type: 'line',
        lineWidth: 2,
        marker: { enabled: true, radius: 2, symbol: 'circle' },
      },
      {
        name: 'Humidity (%)',
        data: generateTimeSeriesData(365, 60, 15),
        color: '#0984e3',
        type: 'spline',
        lineWidth: 2,
        yAxis: 1,
        marker: { enabled: true, radius: 2, symbol: 'square' },
      },
      {
        name: 'Pressure (hPa)',
        data: generateTimeSeriesData(365, 1013, 20),
        color: '#00b894',
        type: 'line',
        lineWidth: 1,
        yAxis: 2,
        marker: { enabled: false },
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 1,
      buttons: [
        { type: 'day', count: 1, text: '24H' },
        { type: 'day', count: 7, text: '1W' },
        { type: 'month', count: 1, text: '1M' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: {
      enabled: true,
      height: 35,
      series: { color: '#e17055', fillOpacity: 0.1 },
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'Date & Time' },
      labels: { format: '{value:%m/%d %H:%M}' },
    },
    yAxis: [
      {
        title: { text: 'Temperature (°C)', style: { color: '#e17055' } },
        labels: { format: '{value}°C', style: { color: '#e17055' } },
        opposite: false,
      },
      {
        title: { text: 'Humidity (%)', style: { color: '#0984e3' } },
        labels: { format: '{value}%', style: { color: '#0984e3' } },
        opposite: true,
      },
      {
        title: { text: 'Pressure (hPa)', style: { color: '#00b894' } },
        labels: { format: '{value} hPa', style: { color: '#00b894' } },
        opposite: false,
        offset: 60,
      },
    ],
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#2d3436',
      borderRadius: 6,
      formatter: function (this: any) {
        let tooltip = `<b>${Highcharts.dateFormat('%A, %b %e, %Y %H:%M', this.x)}</b><br/>`;
        this.points.forEach((point: any) => {
          let unit = '';
          if (point.series.name.includes('Temperature')) unit = '°C';
          else if (point.series.name.includes('Humidity')) unit = '%';
          else if (point.series.name.includes('Pressure')) unit = ' hPa';

          tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y.toFixed(1)}${unit}</b><br/>`;
        });
        return tooltip;
      },
    },
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#2d3436',
      gridColor: '#ddd',
      lineColor: '#bbb',
    },
  },
};

// 6. High Performance Large Dataset
export const HighPerformance: Story = {
  args: {
    title: 'High-Frequency Trading Data',
    subtitle: 'Optimized for large datasets with boost module',
    width: '100%',
    height: 450,
    series: [
      {
        name: 'Price Feed',
        data: (() => {
          const data = [];
          const start = new Date('2024-01-01').getTime();
          for (let i = 0; i < 10000; i++) {
            data.push([start + i * 60000, 100 + Math.sin(i / 100) * 20 + Math.random() * 10]);
          }
          return data;
        })(),
        color: '#fd79a8',
        type: 'line',
        lineWidth: 1,
        marker: { enabled: false },
      },
    ],
    boost: true,
    turboThreshold: 5000,
    rangeSelector: {
      enabled: true,
      selected: 0,
      buttons: [
        { type: 'hour', count: 1, text: '1H' },
        { type: 'hour', count: 6, text: '6H' },
        { type: 'day', count: 1, text: '1D' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: {
      enabled: true,
      height: 30,
      series: { lineWidth: 1 },
    },
    xAxis: {
      type: 'datetime',
      labels: { format: '{value:%H:%M}' },
    },
    yAxis: {
      title: { text: 'Price' },
      labels: { format: '${value:.2f}' },
    },
    tooltip: {
      shared: false,
      formatter: function (this: any) {
        return `<b>${Highcharts.dateFormat('%H:%M:%S', this.x)}</b><br/>
                Price: <b>$${this.y.toFixed(2)}</b>`;
      },
    },
    animation: { enabled: false },
    plotOptions: {
      series: {
        turboThreshold: 5000,
        animation: false,
      },
    },
  },
};

// 7. Interactive Controls Demo
export const InteractiveControls: Story = {
  render: args => {
    const chartRef = useRef<any>(null);

    const handleExport = (format: 'png' | 'jpeg' | 'pdf' | 'svg') => {
      chartRef.current?.exportChart(format, 'my-chart');
    };

    const handleAddSeries = () => {
      chartRef.current?.addSeries({
        name: `Series ${Date.now()}`,
        data: generateTimeSeriesData(100, Math.random() * 200, 20),
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });
    };

    const handleZoomRange = () => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      chartRef.current?.zoomToRange(thirtyDaysAgo, now);
    };

    return (
      <div>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport('png')}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Export PNG
          </button>
          <button
            onClick={() => handleExport('svg')}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Export SVG
          </button>
          <button
            onClick={handleAddSeries}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Add Random Series
          </button>
          <button
            onClick={handleZoomRange}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Zoom to 30 Days
          </button>
          <button
            onClick={() => chartRef.current?.resetZoom()}
            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Reset Zoom
          </button>
        </div>
        <LineChart
          {...args}
          ref={chartRef}
          onRangeSelect={(min, max) => {
            console.log('Range selected:', new Date(min), 'to', new Date(max));
          }}
          onPointClick={point => {
            console.log('Point clicked:', point);
          }}
        />
      </div>
    );
  },
  args: {
    title: 'Interactive Chart Controls',
    subtitle: 'Click buttons above to test chart methods',
    width: '100%',
    height: 450,
    series: [
      {
        name: 'Sample Data',
        data: generateTimeSeriesData(365, 100, 20),
        color: '#6c5ce7',
        type: 'line',
        lineWidth: 2,
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 2,
      buttons: [
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: { enabled: true },
    scrollbar: { enabled: true },
    exporting: { enabled: true },
  },
};

// 8. Custom Themed Chart
export const CustomTheme: Story = {
  args: {
    title: 'Neon Cyberpunk Theme',
    subtitle: 'Futuristic data visualization',
    width: '100%',
    height: 500,
    series: [
      {
        name: 'Neural Network Activity',
        data: generateTimeSeriesData(180, 85, 25),
        color: '#00ff88',
        type: 'spline',
        lineWidth: 3,
        marker: { enabled: true, radius: 3, symbol: 'circle' },
      },
      {
        name: 'System Load',
        data: generateTimeSeriesData(180, 60, 15),
        color: '#ff0080',
        type: 'line',
        lineWidth: 2,
        dashStyle: 'Dash',
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 1,
      buttons: [
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'all', text: 'ALL' },
      ],
    },
    navigator: {
      enabled: true,
      height: 40,
      maskFill: 'rgba(0, 255, 136, 0.1)',
    },
    theme: {
      backgroundColor: '#0a0a0a',
      textColor: '#00ff88',
      gridColor: '#1a1a1a',
      lineColor: '#333333',
      colors: ['#00ff88', '#ff0080', '#0080ff', '#ffff00', '#ff8000'],
    },
    xAxis: {
      type: 'datetime',
      gridLineColor: '#1a1a1a',
      lineColor: '#333333',
      tickColor: '#333333',
      labels: {
        style: { color: '#00ff88', fontSize: '11px' },
        format: '{value:%m/%d}',
      },
    },
    yAxis: {
      gridLineColor: '#1a1a1a',
      lineColor: '#333333',
      tickColor: '#333333',
      title: {
        text: 'Activity Level (%)',
        style: { color: '#00ff88' },
      },
      labels: {
        style: { color: '#00ff88', fontSize: '11px' },
        format: '{value}%',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: '#00ff88',
      borderWidth: 1,
      style: { color: '#00ff88', fontSize: '12px' },
      shadow: false,
    },
    legend: {
      itemStyle: { color: '#00ff88' },
      itemHoverStyle: { color: '#ffffff' },
    },
  },
};

// Playground for testing
export const Playground: Story = {
  args: {
    title: 'Chart Playground',
    subtitle: 'Experiment with different settings',
    width: '100%',
    height: 500,
    series: [
      {
        name: 'Test Series',
        data: generateTimeSeriesData(200, 100, 20),
        color: '#3498db',
        type: 'line',
        lineWidth: 2,
      },
    ],
    rangeSelector: {
      enabled: true,
      selected: 1,
      buttons: [
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'all', text: 'All' },
      ],
    },
    navigator: { enabled: true },
    scrollbar: { enabled: true },
    responsive: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel to experiment with different chart configurations.',
      },
    },
  },
};
