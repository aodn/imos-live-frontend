import { Outlet } from 'react-router-dom';
import { useDrawerStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Drawer } from '../ui/drawer';

export const Layout = () => {
  const { isOpen, closeDrawer, content } = useDrawerStore(
    useShallow(s => ({
      isOpen: s.isOpen,
      closeDrawer: s.closeDrawer,
      content: s.content,
    })),
  );

  return (
    <div className="min-h-screen w-full">
      <header></header>
      <main className="h-full w-full flex">
        {/* TODO sidebar */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
      <footer></footer>
      <aside>
        <Drawer open={isOpen} onClose={closeDrawer} direction="bottom">
          {content}
        </Drawer>
      </aside>
    </div>
  );
};
