import { Outlet } from 'react-router-dom';
import { useDrawerStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Button, Drawer, useSidebar } from '@/components/ui';
import { MainSidebar } from '@/components/Sidebar';
import { MenuIcon } from '@/components/Icons';
import { cn } from '@/lib/utils';

export const Layout = () => {
  const { isOpen, closeDrawer, content } = useDrawerStore(
    useShallow(s => ({
      isOpen: s.isOpen,
      closeDrawer: s.closeDrawer,
      content: s.content,
    })),
  );
  const { toggleSidebar, open } = useSidebar();
  //TODO maybe do not use useSidebar, it is context, better use zustand to make consistent.

  return (
    <div className={cn('w-full min-h-screen')}>
      <header></header>
      <main className="h-full w-full flex">
        {/* TODO maybe move this sidebar to map page, because it is only used in that page and it is not a sidebar over other elements.*/}
        <MainSidebar />
        <div className="flex-1 h-full relative">
          {!open && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-2 z-99"
              onClick={toggleSidebar}
            >
              <MenuIcon size="xl" className="text-white" />
            </Button>
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
