import { Outlet } from 'react-router-dom';
import { useDrawerStore } from '@/store';
import { Drawer } from '../Drawer';
import { useShallow } from 'zustand/shallow';
import { useCurrentPage } from '@/hooks';
import { cn } from '@/utils';

export const Layout = () => {
  const { bottomDrawer, closeBottomDrawer } = useDrawerStore(
    useShallow(s => ({
      bottomDrawer: s.bottomDrawer,
      closeBottomDrawer: s.closeBottomDrawer,
    })),
  );

  const page = useCurrentPage();

  return (
    <div
      className={cn('w-full min-h-screen flex flex-col', {
        'h-screen-exact': page === 'map',
      })}
    >
      <main className="h-full w-full flex-1">
        <Outlet />
      </main>
      <aside>
        <Drawer
          isOpen={bottomDrawer.isOpen}
          closeDrawer={closeBottomDrawer}
          snapMode={bottomDrawer.snapMode}
          direction={bottomDrawer.direction}
          snapPoints={bottomDrawer.snapPoints}
          children={bottomDrawer.content}
        />
      </aside>
    </div>
  );
};
