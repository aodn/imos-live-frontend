import {
  CollapsibleComponent,
  CollapsibleComponentProps,
  DragWrapperProps,
  ImosDragWrapper,
} from '..';
import { useToggle } from '@/hooks';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { CollapsibleTrigger } from './CollapsibleTrigger';

type FloatingPanelProps = Omit<CollapsibleComponentProps, 'open' | 'toggle' | 'trigger'> &
  Omit<DragWrapperProps, 'children' | 'dragHandleClassName'> & {
    collapsible?: boolean;
  };

export const FloatingPanel = ({
  maxHeight,
  children,
  wrapperClassName = '',
  bounds,
  initialPosition,
  collapsible = false,
}: FloatingPanelProps) => {
  const { open, toggle } = useToggle(false);
  const dragHandleId = useId();
  const dragHandleClass = `panel-drag-handle-${dragHandleId}`;

  return (
    // <DragWrapper
    //   bounds={bounds}
    //   dragHandleClassName={dragHandleClass}
    //   initialPosition={initialPosition}
    // >
    //   {collapsible && (
    //     <CollapsibleComponent
    //       maxHeight={maxHeight}
    //       wrapperClassName={wrapperClassName}
    //       open={open}
    //       trigger={
    //         <CollapsibleTrigger
    //           clasName="rounded-t-xl"
    //           open={open}
    //           toggle={toggle}
    //           dragHandleClass={dragHandleClass}
    //         />
    //       }
    //       children={children}
    //     />
    //   )}
    //   {!collapsible && <div className={cn(wrapperClassName, dragHandleClass)}>{children}</div>}
    // </DragWrapper>

    <ImosDragWrapper
      boundary={bounds}
      dragHandleClassName={dragHandleClass}
      initialPosition={initialPosition}
      relative="topRight"
    >
      {collapsible && (
        <CollapsibleComponent
          maxHeight={maxHeight}
          wrapperClassName={wrapperClassName}
          open={open}
          trigger={
            <CollapsibleTrigger
              clasName="rounded-t-xl"
              open={open}
              toggle={toggle}
              dragHandleClass={dragHandleClass}
            />
          }
          children={children}
        />
      )}
      {!collapsible && <div className={cn(wrapperClassName, dragHandleClass)}>{children}</div>}
    </ImosDragWrapper>
  );
};
