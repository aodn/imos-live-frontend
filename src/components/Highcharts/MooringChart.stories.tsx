import type { Meta, StoryObj } from '@storybook/react';
import { PRODUCT } from '@/constants';
import type { SiteFeature } from '@/types';
import axios, { type AxiosAdapter } from 'axios';
import { MooringChart } from './MooringChart';

const HOUR_MS = 60 * 60 * 1000;
const LATEST_TIME = '2026-11-01T12:00:00Z';

function buildSeries(base: number, amplitude: number): [number, number][] {
  const end = Date.parse(LATEST_TIME);
  return Array.from({ length: 24 * 14 }, (_, i) => [
    end - (24 * 14 - 1 - i) * HOUR_MS,
    base + amplitude * Math.sin(i / 6),
  ]);
}

const TIMESERIES_PROPERTIES = {
  'NOMINAL_DEPTH_10.0': {
    TEMP: buildSeries(18, 1),
    PSAL: buildSeries(35.2, 0.1),
    DOX1: buildSeries(220, 8),
  },
  'NOMINAL_DEPTH_50.0': {
    TEMP: buildSeries(15, 0.6),
    PSAL: buildSeries(35.4, 0.05),
    DOX1: buildSeries(210, 5),
  },
};

const ESTUARINE_PROPERTIES = {
  'NOMINAL_DEPTH_0.9': {
    TEMP: buildSeries(18, 1),
    PSAL: buildSeries(35.2, 0.1),
    CPHL: buildSeries(0.5, 0.2),
    DOXS: buildSeries(101, 3),
    TURB: buildSeries(1.2, 0.2),
    FDOM: buildSeries(0.4, 0.1),
    PHYCO: [],
    FLUSI: buildSeries(1.7, 0.2),
  },
};

// Answers the chart's requests with sample data so the story runs without a backend.
const sampleDataAdapter: AxiosAdapter = async config => {
  const url = config.url ?? '';
  const data = url.endsWith('latest_available_date')
    ? { time: LATEST_TIME }
    : {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [138.314, -34.728] },
        properties: url.includes('mooring_estuarine')
          ? ESTUARINE_PROPERTIES
          : TIMESERIES_PROPERTIES,
      };
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};

function buildMooringData(site: string): Omit<SiteFeature, 'type'>[] {
  return [
    {
      geometry: { type: 'Point', coordinates: [138.314, -34.728] },
      properties: { _id: site, site, date: '2026-11-01' },
    },
  ];
}

const meta: Meta<typeof MooringChart> = {
  title: 'components/MooringChart',
  component: MooringChart,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    const originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = sampleDataAdapter;
    return () => {
      axios.defaults.adapter = originalAdapter;
    };
  },
};

export default meta;
type Story = StoryObj<typeof MooringChart>;

export const Default: Story = {
  args: {
    product: PRODUCT.MOORING_TIMESERIES_REALTIME,
    mooringData: buildMooringData('NRSMAI'),
  },
};

export const EstuarineWaterQuality: Story = {
  args: {
    product: PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
    mooringData: buildMooringData('SA-ST-KILDA'),
  },
};
