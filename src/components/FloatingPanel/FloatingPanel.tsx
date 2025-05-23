import { CollapsibleComponent, CollapsibleComponentProps, DragWrapper, DragWrapperProps } from '..';
import { useToggle } from '@/hooks';
import { useId } from 'react';
import { CollapsibleTriggerProps } from './CollapsibleTrigger';

type FloatingPanelProps = Omit<CollapsibleComponentProps, 'open' | 'toggle' | 'trigger'> &
  Omit<DragWrapperProps, 'children' | 'dragHandleClassName'> & {
    TriggerComp: React.FunctionComponent<CollapsibleTriggerProps>;
  };

export const FloatingPanel = ({
  maxHeight,
  children,
  wrapperClassName = '',
  bounds,
  TriggerComp,
}: FloatingPanelProps) => {
  const { open, toggle } = useToggle(false);
  const dragHandleId = useId();
  const dragHandleClass = `panel-drag-handle-${dragHandleId}`;

  return (
    <DragWrapper bounds={bounds} dragHandleClassName={dragHandleClass}>
      <CollapsibleComponent
        maxHeight={maxHeight}
        wrapperClassName={wrapperClassName}
        open={open}
        trigger={<TriggerComp open={open} toggle={toggle} dragHandleClass={dragHandleClass} />}
        children={children}
      />
    </DragWrapper>
  );
};
