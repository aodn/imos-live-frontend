import { Outlet } from 'react-router-dom';
import { useDrawerStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Drawer, useSidebar } from '@/components/ui';
import { MainSidebar } from '@/components/Sidebar';
import { MenuIcon } from '@/components/Icons';

export const Layout = () => {
  const { isOpen, closeDrawer, content } = useDrawerStore(
    useShallow(s => ({
      isOpen: s.isOpen,
      closeDrawer: s.closeDrawer,
      content: s.content,
    })),
  );
  const { toggleSidebar, open } = useSidebar();
  return (
    <div className="min-h-screen w-full">
      <header></header>
      <main className="h-full w-full flex">
        <MainSidebar />
        <div className="flex-1 relative">
          {!open && (
            <button className="absolute left-2 top-2 z-99 w-10" onClick={toggleSidebar}>
              <MenuIcon size="xl" className="text-white" />
            </button>
          )}
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
