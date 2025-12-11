import { useMemo } from 'react';
import type { SelectionPanelProps } from '../type';
import { getDateFromPercent, formatDate } from '../utils';

export const SelectionPanel = ({
  position,
  startDate,
  endDate,
  moveByStep,
  renderSelectionPanel,
  dateFormat,
  locale,
  timeUnit,
}: SelectionPanelProps) => {
  const dateLabel = useMemo(() => {
    const date = getDateFromPercent(position, startDate, endDate);
    return formatDate({ date, format: dateFormat, locale, variant: 'label', timeUnit });
  }, [position, startDate, endDate, dateFormat, locale, timeUnit]);

  return renderSelectionPanel({
    dateLabel,
    toNextDate: () => moveByStep('forward', 'point'),
    toPrevDate: () => moveByStep('backward', 'point'),
  });
};
