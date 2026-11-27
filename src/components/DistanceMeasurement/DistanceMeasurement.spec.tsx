// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useMapUIStore } from '@/store';
import { DistanceMeasurement } from './DistanceMeasurement';

describe('DistanceMeasurement close button', () => {
  afterEach(cleanup);

  it('clears the path and turns the measure tool off', () => {
    useMapUIStore.setState({ distanceMeasurementEnabled: true });
    const setDistance = vi.fn();
    const setMeasurePointsGeojson = vi.fn();
    render(
      <DistanceMeasurement
        distance="12 km"
        setDistance={setDistance}
        setMeasurePointsGeojson={setMeasurePointsGeojson}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close measure panel' }));

    expect(setDistance).toHaveBeenCalledWith('');
    expect(setMeasurePointsGeojson).toHaveBeenCalledWith({
      type: 'FeatureCollection',
      features: [],
    });
    expect(useMapUIStore.getState().distanceMeasurementEnabled).toBe(false);
  });
});
