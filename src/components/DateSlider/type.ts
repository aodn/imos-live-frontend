import { ReactNode, RefObject } from 'react';

export type ViewMode = 'range' | 'point' | 'combined';
export type TimeUnit = 'day' | 'month' | 'year';
export type DragHandle = 'start' | 'end' | 'point' | null;

type RangeSelection = {
  range: {
    start: Date;
    end: Date;
  };
};

export type PointSelection = {
  point: Date;
};

export type TimeLabel = {
  date: Date;
  position: number;
};

type CombinedSelection = RangeSelection & PointSelection;

export type SelectionResult = RangeSelection | PointSelection | CombinedSelection;

export type ScaleUnitConfig = {
  gap?: number;
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
  startDate: Date; //this should be local date time
  endDate: Date; //this should be local date time
  initialTimeUnit: TimeUnit;
  initialRange?: { start: Date; end: Date };
  initialPoint?: Date;
  wrapperClassName?: string;
  sliderClassName?: string;
  timeUnitSelectionClassName?: string;
  trackBaseClassName?: string;
  trackActiveClassName?: string;
  pointHandleIcon?: ReactNode;
  rangeHandleIcon?: ReactNode;
  onChange: (selection: SelectionResult) => void;
  scrollable?: boolean;
  isTrackFixedWidth?: boolean;
  minGapScaleUnits?: number;
  scaleUnitConfig?: ScaleUnitConfig;
  trackPaddingX?: number;
  sliderWidth?: 'fill' | number; //fill means its width will fill parent.
  sliderHeight?: number;
  imperativeHandleRef?: React.Ref<SliderExposedMethod>;
  withEndLabel?: boolean;
  timeUnitSelectionEnabled?: boolean;
  freeSelectionOnTrackClick?: boolean; //if true, the datetime can be freely selected when click on track, if false, the selection will be limited to datetime per scale units.
};

export type ScaleType = 'short' | 'medium' | 'long';
export type Scale = { position: number; type: ScaleType; date: Date };
export type NumOfScales = { short: number; medium: number; long: number };

type BaseSliderTrackProps = {
  onTrackClick: (e: React.MouseEvent) => void;
  onTrackTouch: (e: React.TouchEvent) => void;
  baseTrackclassName?: string;
  scales: Scale[];
  scaleUnitConfig: ScaleUnitConfig;
  trackRef: RefObject<HTMLDivElement | null>;
  startDate: Date;
  endDate: Date;
  onDragging: boolean;
  startHandleRef: React.RefObject<HTMLButtonElement | null>;
  endHandleRef: React.RefObject<HTMLButtonElement | null>;
  pointHandleRef: React.RefObject<HTMLButtonElement | null>;
};

type PointModeProps = {
  mode: 'point';
  activeTrackClassName?: string;
  pointPosition: number;
};

type CombinedModeProps = {
  mode: 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  inactiveTrackClassName?: string;
  activeTrackClassName?: string;
};

type RangeModeProps = {
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
  onTouchStart?: (e: React.TouchEvent) => void;
  ref: RefObject<HTMLButtonElement | null>;
  min?: number;
  max?: number;
  value?: number;
  handleType: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  viewMode?: 'point' | 'range' | 'combined';
};

export type RenderSliderHandleProps = {
  viewMode: 'point' | 'range' | 'combined';
  rangeStart: number;
  rangeEnd: number;
  pointPosition: number;
  startDate: Date;
  endDate: Date;
  timeUnit: TimeUnit;
  isDragging: DragHandle | false;
  rangeHandleIcon?: React.ReactNode;
  pointHandleIcon?: React.ReactNode;
  startHandleRef: React.RefObject<HTMLButtonElement | null>;
  endHandleRef: React.RefObject<HTMLButtonElement | null>;
  pointHandleRef: React.RefObject<HTMLButtonElement | null>;
  onHandleFocus: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onMouseDown: (handle: DragHandle) => (e: React.MouseEvent) => void;
  onTouchStart: (handle: DragHandle) => (e: React.TouchEvent) => void;
  onKeyDown: (handle: DragHandle) => (e: React.KeyboardEvent) => void;
};

export type TimeUnitSelectionProps = {
  initialTimeUnit: TimeUnit;
  isMonthValid: boolean;
  isYearValid: boolean;
  onChange: (timeUnit: TimeUnit) => void;
  className?: string;
};

export type TimeLabelsProps = {
  timeLabels: TimeLabel[];
  scales: Scale[];
  trackWidth: number;
  minDistance?: number;
  className?: string;
  withEndLabel?: boolean;
};
