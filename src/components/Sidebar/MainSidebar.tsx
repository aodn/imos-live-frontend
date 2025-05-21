import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui';
import { CloseIcon } from '@/components/Icons';

export const MainSidebar = () => {
  const { toggleSidebar, open } = useSidebar();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 flex justify-between">
          <h2 className="text-lg font-bold">IMOS LIVE</h2>
          {open && (
            <button onClick={toggleSidebar}>
              <CloseIcon size="xl" className="text-red-700" />
            </button>
          )}
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
