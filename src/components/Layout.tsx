import { Outlet } from 'react-router-dom';
import { Drawer } from '@heroui/react';
import { useDrawerStore } from '@/store';

export const Layout = () => {
  const { isOpen, closeDrawer, content } = useDrawerStore();

  return (
    <div className="min-h-screen w-full">
      <header></header>
      <main className="h-full w-full">
        <Outlet />
      </main>
      <footer></footer>
      <aside>
        <Drawer isOpen={isOpen} onClose={closeDrawer} placement="bottom">
          {content}
        </Drawer>
      </aside>
    </div>
  );
};
