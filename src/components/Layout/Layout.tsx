import { Outlet } from 'react-router-dom';
import { useDrawerStore } from '@/store';
import { Drawer } from '../Drawer';

export const Layout = () => {
  const content = useDrawerStore(s => s.content);

  return (
    <div className="w-full min-h-screen flex flex-col">
      <header></header>
      <main className="h-full w-full flex-1">
        <Outlet />
      </main>
      <footer></footer>
      <aside>
        <Drawer
          snapMode="snap"
          direction="bottom"
          snapPoints={['30%', '50%', '70%']}
          children={content}
        />
      </aside>
    </div>
  );
};
