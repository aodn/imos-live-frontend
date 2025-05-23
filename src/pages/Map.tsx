import {
  MapComponent,
  MenuComponent,
  DragWrapper,
  Button,
  CollapsibleComponent,
  DragIndicatorIcon,
  ArrowDownIcon,
} from '@/components';
import { PANEL_DRAG_HANDLER_CLASSNAME } from '@/constants';
import { useToggle } from '@/hooks';
import { cn } from '@/lib/utils';
import { useMapUIStore } from '@/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect } from 'react';

export const Map = () => {
  const refreshDatasets = useMapUIStore(s => s.refreshDatasets);
  const { open, toggle } = useToggle(false);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <div className="h-full w-full">
      <MapComponent />
      <DragWrapper bounds="parent" dragHandleClassName={PANEL_DRAG_HANDLER_CLASSNAME}>
        <CollapsibleComponent
          wrapperClassName="bg-[rgba(35,55,75,0.9)] text-[#ddd] font-mono rounded p-4"
          open={open}
          trigger={
            <div className="flex">
              <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={toggle}>
                <ArrowDownIcon
                  color="imos-white"
                  className={cn('transition-transform duration-300', open && 'rotate-180')}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 imos-drag-handle hover:bg-transparent"
              >
                <DragIndicatorIcon color="imos-white" className="rotate-180" />
              </Button>
            </div>
          }
          children={<MenuComponent />}
        />
      </DragWrapper>
    </div>
  );
};
