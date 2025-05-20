import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

export const MainSidebar = () => {
  const { toggleSidebar, open } = useSidebar();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 flex justify-between">
          <h2 className="text-lg font-bold">IMOS LIVE</h2>
          {open && <button onClick={toggleSidebar}>close side bar</button>}
        </div>
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          <p className="text-sm">Footer Content</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
