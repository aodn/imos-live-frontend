import { Outlet } from 'react-router-dom';
import { useDrawerStore, closeBottomDrawer } from '@/store';
import { Drawer } from '../Drawer';
import { useCurrentPage } from '@/hooks';
import { cn } from '@/utils';

export const Layout = () => {
  const bottomDrawer = useDrawerStore(s => s.bottomDrawer);

  const page = useCurrentPage();

  return (
    <div
      className={cn('w-full  flex flex-col', {
        'h-screen-exact': page === 'map',
        'min-h-screen': page !== 'map',
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
