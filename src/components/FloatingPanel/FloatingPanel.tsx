import type { CollapsibleComponentProps, DragWrapperProps } from '..';
import { CollapsibleComponent, DragWrapper } from '..';
import { useId } from 'react';
import { CollapsibleTrigger } from './CollapsibleTrigger';

type FloatingPanelProps = Omit<CollapsibleComponentProps, 'open' | 'toggle' | 'trigger'> &
  Omit<DragWrapperProps, 'children' | 'dragHandleClassName'> & {
    collapsible?: boolean;
    initialOpen?: boolean;
  };

export function FloatingPanel({
  maxHeight,
  children,
  wrapperClassName = '',
  boundary,
  initialPosition,
  collapsible = false,
  initialOpen = false,
}: FloatingPanelProps) {
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
        defaultOpen={initialOpen}
        maxHeight={maxHeight}
        wrapperClassName={wrapperClassName}
        trigger={({ open, toggle, toggleIconHidden }) => (
          <CollapsibleTrigger
            toggleIconHidden={toggleIconHidden}
            open={open}
            toggle={toggle}
            dragHandleClass={dragHandleClass}
          />
        )}
        children={children}
      />
    </DragWrapper>
  );
}
