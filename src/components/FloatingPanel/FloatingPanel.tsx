import { CollapsibleComponent, CollapsibleComponentProps, DragWrapperProps, DragWrapper } from '..';
import { useId } from 'react';
import { CollapsibleTrigger } from './CollapsibleTrigger';

type FloatingPanelProps = Omit<CollapsibleComponentProps, 'open' | 'toggle' | 'trigger'> &
  Omit<DragWrapperProps, 'children' | 'dragHandleClassName'> & {
    collapsible?: boolean;
  };

export const FloatingPanel = ({
  maxHeight,
  children,
  wrapperClassName = '',
  boundary,
  initialPosition,
  collapsible = false,
}: FloatingPanelProps) => {
  const dragHandleId = useId();
  const dragHandleClass = `panel-drag-handle-${dragHandleId}`;

  return (
    <DragWrapper
      boundary={boundary}
      dragHandleClassName={dragHandleClass}
      initialPosition={initialPosition}
      relative="topRight"
    >
      <CollapsibleComponent
        disable={!collapsible}
        toggleIconHidden={!collapsible}
        defaultOpen={!collapsible}
        maxHeight={maxHeight}
        wrapperClassName={wrapperClassName}
        trigger={({ open, toggle, toggleIconHidden }) => (
          <CollapsibleTrigger
            toggleIconHidden={toggleIconHidden}
            clasName="rounded-t-xl"
            open={open}
            toggle={toggle}
            dragHandleClass={dragHandleClass}
          />
        )}
        children={children}
      />
    </DragWrapper>
  );
};
