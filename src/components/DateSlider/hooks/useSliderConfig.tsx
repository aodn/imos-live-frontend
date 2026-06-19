import { CircleIcon, MoveHorizontalIcon } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { LAYOUT, DEFAULTS, DEFAULT_SCALE_CONFIG } from '../constants';
import type { SliderProps } from '../type';
import { scaleDateFormatFn, labelDateFormatFn } from '../utils';

/**
 * extract and process all configuration from SliderProps with defaults applied.
 * Separates configuration logic from business logic for better maintainability.
 *
 * @param props - Raw slider props from component
 * @param isSmallScreen - Whether viewport is small (for mobile behavior)
 * @returns Processed configuration object with all defaults applied
 */
export function useSliderConfig(props: SliderProps, isSmallScreen: boolean) {
  const {
    icons,
    behavior,
    layout,
    dateFormat,
    locale = 'en',
    scaleTypeResolver,
    mode: viewMode,
    min: startDate,
    max: endDate,
    value,
  } = props;

  // extract icon configuration with defaults
  const iconConfig = useMemo(() => {
    let pointHandleIcon: ReactNode = <CircleIcon />;
    let rangeHandleIcon: ReactNode = <MoveHorizontalIcon />;

    if (icons && 'point' in icons && icons.point) {
      pointHandleIcon = icons.point;
    }
    if (icons && 'range' in icons && icons.range) {
      rangeHandleIcon = icons.range;
    }

    return { pointHandleIcon, rangeHandleIcon };
  }, [icons]);

  // extract behavior configuration with defaults
  const behaviorConfig = useMemo(() => {
    const scrollable = behavior?.scrollable ?? true;
    const freeSelectionOnTrackClick = behavior?.freeSelectionOnTrackClick ?? false;
    const sliderAutoScrollToPointHandleVisibleEnabled =
      behavior?.sliderAutoScrollToPointHandleVisibleEnabled ?? true;
    const resizeObservationEnabled = behavior?.resizeObservationEnabled ?? true;

    // handle label behavior - specific settings override general ones
    const globalLabelPersistent = isSmallScreen || (behavior?.handleLabelPersistent ?? false);
    const globalLabelDisabled = behavior?.handleLabelDisabled ?? false;

    const pointHandleLabelPersistent =
      behavior?.pointHandleLabelPersistent ?? globalLabelPersistent;
    const pointHandleLabelDisabled = behavior?.pointHandleLabelDisabled ?? globalLabelDisabled;

    const rangeHandleLabelPersistent =
      behavior?.rangeHandleLabelPersistent ?? globalLabelPersistent;
    const rangeHandleLabelDisabled = behavior?.rangeHandleLabelDisabled ?? globalLabelDisabled;

    const trackHoverDateLabelDisabled = behavior?.trackHoverDateLabelDisabled ?? false;
    const trackHoverCursorLineDisabled = behavior?.trackHoverCursorLineDisabled ?? false;

    return {
      ...behavior,
      scrollable,
      freeSelectionOnTrackClick,
      sliderAutoScrollToPointHandleVisibleEnabled,
      resizeObservationEnabled,
      pointHandleLabelPersistent,
      pointHandleLabelDisabled,
      rangeHandleLabelPersistent,
      rangeHandleLabelDisabled,
      trackHoverDateLabelDisabled,
      trackHoverCursorLineDisabled,
    };
  }, [behavior, isSmallScreen]);

  // extract layout configuration with defaults
  const layoutConfig = useMemo(() => {
    const sliderWidth = layout?.width;
    const sliderHeight = layout?.height;
    const trackPaddingX = layout?.trackPaddingX ?? LAYOUT.TRACK_PADDING_X;
    const isTrackFixedWidth = !behaviorConfig.scrollable;

    const selectionPanelEnabled = layout?.selectionPanelEnabled ?? false;
    const timeUnitSelectionEnabled = layout?.timeUnitSelectionEnabled ?? false;
    const dateLabelEnabled = layout?.dateLabelEnabled ?? false;

    const withEndLabel = layout?.showEndLabel ?? true;
    const minGapScaleUnits = layout?.minGapScaleUnits ?? DEFAULTS.MIN_GAP_SCALE_UNITS;
    const scaleUnitConfig = layout?.scaleUnitConfig ?? DEFAULT_SCALE_CONFIG;
    const dateLabelDistance = layout?.dateLabelDistanceOverHandle ?? LAYOUT.DATE_LABEL_DISTANCE;

    return {
      sliderWidth,
      sliderHeight,
      trackPaddingX,
      isTrackFixedWidth,
      selectionPanelEnabled,
      timeUnitSelectionEnabled,
      dateLabelEnabled,
      withEndLabel,
      minGapScaleUnits,
      scaleUnitConfig,
      dateLabelDistance,
    };
  }, [layout, behaviorConfig.scrollable]);

  // extract date format configuration with defaults
  const dateFormatConfig = useMemo(() => {
    return {
      scale: dateFormat?.scale || scaleDateFormatFn,
      label: dateFormat?.label || labelDateFormatFn,
    };
  }, [dateFormat]);

  // extract and normalize initial values from value prop
  const initialValues = useMemo(() => {
    const propInitialPoint =
      value && 'point' in value ? value.point : viewMode === 'point' ? startDate : undefined;
    const propInitialRange =
      value && 'start' in value && 'end' in value
        ? { start: value.start, end: value.end }
        : viewMode === 'range' || viewMode === 'combined'
          ? { start: startDate, end: endDate }
          : undefined;

    return {
      point: propInitialPoint,
      range: propInitialRange,
    };
  }, [value, viewMode, startDate, endDate]);

  return {
    icons: iconConfig,
    behavior: behaviorConfig,
    layout: layoutConfig,
    dateFormat: dateFormatConfig,
    locale,
    scaleTypeResolver,
    initialValues,
  };
}
