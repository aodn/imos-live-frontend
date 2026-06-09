// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSliderConfig } from './useSliderConfig';
import { DEFAULT_SCALE_CONFIG, DEFAULTS, LAYOUT } from '../constants';
import { labelDateFormatFn, scaleDateFormatFn } from '../utils';
import type { SliderProps } from '../type';

const startDate = new Date('2026-01-01T00:00:00Z');
const endDate = new Date('2026-01-31T00:00:00Z');

const makeProps = (overrides: Partial<SliderProps> = {}): SliderProps =>
  ({
    mode: 'point',
    min: startDate,
    max: endDate,
    initialTimeUnit: 'day',
    onChange: () => {},
    layout: { width: 'fill' },
    ...overrides,
  }) as SliderProps;

describe('useSliderConfig', () => {
  describe('behavior defaults', () => {
    it('applies sensible defaults when behavior is omitted', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), false));
      expect(result.current.behavior.scrollable).toBe(true);
      expect(result.current.behavior.freeSelectionOnTrackClick).toBe(false);
      expect(result.current.behavior.sliderAutoScrollToPointHandleVisibleEnabled).toBe(true);
      expect(result.current.behavior.pointHandleLabelPersistent).toBe(false);
      expect(result.current.behavior.pointHandleLabelDisabled).toBe(false);
      expect(result.current.behavior.rangeHandleLabelPersistent).toBe(false);
      expect(result.current.behavior.rangeHandleLabelDisabled).toBe(false);
      expect(result.current.behavior.trackHoverDateLabelDisabled).toBe(false);
      expect(result.current.behavior.trackHoverCursorLineDisabled).toBe(false);
    });

    it('forces handle labels to persistent on small screens', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), true));
      expect(result.current.behavior.pointHandleLabelPersistent).toBe(true);
      expect(result.current.behavior.rangeHandleLabelPersistent).toBe(true);
    });

    it('lets specific persistence override the global flag', () => {
      const { result } = renderHook(() =>
        useSliderConfig(
          makeProps({
            behavior: { handleLabelPersistent: true, pointHandleLabelPersistent: false },
          }),
          false,
        ),
      );
      expect(result.current.behavior.rangeHandleLabelPersistent).toBe(true);
      expect(result.current.behavior.pointHandleLabelPersistent).toBe(false);
    });
  });

  describe('layout defaults', () => {
    it('falls back to layout constants when nothing is supplied', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), false));
      expect(result.current.layout.trackPaddingX).toBe(LAYOUT.TRACK_PADDING_X);
      expect(result.current.layout.minGapScaleUnits).toBe(DEFAULTS.MIN_GAP_SCALE_UNITS);
      expect(result.current.layout.scaleUnitConfig).toBe(DEFAULT_SCALE_CONFIG);
      expect(result.current.layout.dateLabelDistance).toBe(LAYOUT.DATE_LABEL_DISTANCE);
      expect(result.current.layout.withEndLabel).toBe(true);
      expect(result.current.layout.selectionPanelEnabled).toBe(false);
      expect(result.current.layout.timeUnitSelectionEnabled).toBe(false);
      expect(result.current.layout.dateLabelEnabled).toBe(false);
    });

    it('isTrackFixedWidth is the inverse of behavior.scrollable', () => {
      const { result: scrollable } = renderHook(() =>
        useSliderConfig(makeProps({ behavior: { scrollable: true } }), false),
      );
      const { result: fixed } = renderHook(() =>
        useSliderConfig(makeProps({ behavior: { scrollable: false } }), false),
      );
      expect(scrollable.current.layout.isTrackFixedWidth).toBe(false);
      expect(fixed.current.layout.isTrackFixedWidth).toBe(true);
    });
  });

  describe('dateFormat defaults', () => {
    it('uses internal format functions when not provided', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), false));
      expect(result.current.dateFormat.scale).toBe(scaleDateFormatFn);
      expect(result.current.dateFormat.label).toBe(labelDateFormatFn);
    });

    it('lets the caller override either format function', () => {
      const customScale = () => 'YYYY';
      const { result } = renderHook(() =>
        useSliderConfig(makeProps({ dateFormat: { scale: customScale } }), false),
      );
      expect(result.current.dateFormat.scale).toBe(customScale);
      expect(result.current.dateFormat.label).toBe(labelDateFormatFn);
    });
  });

  describe('initialValues', () => {
    it('defaults point mode without a value to the start date', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps({ mode: 'point' }), false));
      expect(result.current.initialValues.point).toEqual(startDate);
      expect(result.current.initialValues.range).toBeUndefined();
    });

    it('defaults range mode without a value to the min/max range', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps({ mode: 'range' }), false));
      expect(result.current.initialValues.point).toBeUndefined();
      expect(result.current.initialValues.range).toEqual({ start: startDate, end: endDate });
    });

    it('defaults combined mode without a value to the min/max range (no point)', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps({ mode: 'combined' }), false));
      expect(result.current.initialValues.range).toEqual({ start: startDate, end: endDate });
      expect(result.current.initialValues.point).toBeUndefined();
    });

    it('uses value.point when provided in point mode', () => {
      const point = new Date('2026-01-15T00:00:00Z');
      const { result } = renderHook(() =>
        useSliderConfig(makeProps({ mode: 'point', value: { point } }), false),
      );
      expect(result.current.initialValues.point).toBe(point);
    });

    it('uses value.start/value.end when provided in range mode', () => {
      const start = new Date('2026-01-10T00:00:00Z');
      const end = new Date('2026-01-20T00:00:00Z');
      const { result } = renderHook(() =>
        useSliderConfig(makeProps({ mode: 'range', value: { start, end } }), false),
      );
      expect(result.current.initialValues.range).toEqual({ start, end });
    });
  });

  describe('locale + scaleTypeResolver', () => {
    it('defaults locale to "en"', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), false));
      expect(result.current.locale).toBe('en');
    });

    it('passes through custom locale and scaleTypeResolver', () => {
      const scaleTypeResolver = () => 'long' as const;
      const { result } = renderHook(() =>
        useSliderConfig(makeProps({ locale: 'fr', scaleTypeResolver }), false),
      );
      expect(result.current.locale).toBe('fr');
      expect(result.current.scaleTypeResolver).toBe(scaleTypeResolver);
    });
  });

  describe('icons', () => {
    it('provides default icons for both point and range', () => {
      const { result } = renderHook(() => useSliderConfig(makeProps(), false));
      expect(result.current.icons.pointHandleIcon).toBeTruthy();
      expect(result.current.icons.rangeHandleIcon).toBeTruthy();
    });

    it('uses a custom point icon when provided', () => {
      const customIcon = <span data-testid="custom-point" />;
      const { result } = renderHook(() =>
        useSliderConfig(makeProps({ mode: 'point', icons: { point: customIcon } }), false),
      );
      expect(result.current.icons.pointHandleIcon).toBe(customIcon);
    });
  });
});
