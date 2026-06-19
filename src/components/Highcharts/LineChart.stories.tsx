import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';
import type { SeriesData } from './type';

// Simple time-series data generator
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

const meta: Meta<typeof LineChart> = {
  title: 'components/LineChart',
  component: LineChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A time-series line chart built on Highcharts.',
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

// Basic single-series line chart
export const Default: Story = {
  args: {
    title: 'Line Chart',
    subtitle: 'A single time series',
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
        yAxis: 0,
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
    xAxis: { type: 'datetime' },
    yAxis: { title: { text: undefined } },
    legend: { enabled: false },
  },
};

// Playground for experimenting with the controls panel
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
        yAxis: 0,
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
};
