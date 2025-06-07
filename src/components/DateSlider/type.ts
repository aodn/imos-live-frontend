import { ReactNode, RefObject } from 'react';

export type ViewMode = 'range' | 'point' | 'combined';
export type TimeUnit = 'day' | 'month' | 'year';
export type DragHandle = 'start' | 'end' | 'point' | null;

export type RangeSelection = {
  range: {
    start: Date;
    end: Date;
  };
};

export type PointSelection = {
  point: Date;
};

export type CombinedSelection = RangeSelection & PointSelection;

export type SelectionResult = RangeSelection | PointSelection | CombinedSelection;

export type ScaleUnitConfig = {
  gap: number;
  width: {
    short: number;
    medium: number;
    long: number;
  };
  height: {
    short: number;
    medium: number;
    long: number;
  };
};

export type SliderExposedMethod = {
  setDateTime: (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => void;
};

export type SliderProps = {
  viewMode: ViewMode;
  startDate: Date;
  endDate: Date;
  initialTimeUnit: TimeUnit;
  initialRange?: { start: Date; end: Date };
  initialPoint?: Date;
  wrapperClassName?: string;
  trackBaseClassName?: string;
  trackActiveClassName?: string;
  pointHandleIcon?: ReactNode;
  rangeHandleIcon?: ReactNode;
  onChange: (selection: SelectionResult) => void;
  scrollable?: boolean;
  isTrackFixedWidth?: boolean;
  trackFixedWidth?: number;
  minGapScaleUnits?: number;
  scaleUnitConfig?: ScaleUnitConfig;
  trackPaddingX?: number;
  sliderWidth?: number;
  sliderHeight?: number;
  imperativeHandleRef?: React.Ref<SliderExposedMethod>;
};

export type ScaleType = 'short' | 'medium' | 'long';
export type Scale = { position: number; type: ScaleType; date: Date };
export type NumOfScales = { short: number; medium: number; long: number };

export type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  baseTrackclassName?: string;
  scales: Scale[];
  width: number;
  scaleUnitConfig: ScaleUnitConfig;
  trackRef: RefObject<HTMLDivElement | null>;
};

export type PointModeProps = {
  mode: 'point';
  activeTrackClassName?: string;
  pointPosition: number;
};

export type CombinedModeProps = {
  mode: 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

export type RangeModeProps = {
  mode: 'range';
  rangeStart: number;
  rangeEnd: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

export type SliderTrackProps = BaseSliderTrackProps &
  (PointModeProps | RangeModeProps | CombinedModeProps);

export type SliderHandleProps = {
  className?: string;
  labelClassName?: string;
  onDragging: boolean;
  position: number;
  label: string;
  icon: ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
};
