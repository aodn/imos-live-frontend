import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  Button,
} from '@/components/ui';
import { CloseIcon } from '@/components/Icons';

export const MainSidebar = () => {
  const { toggleSidebar, open } = useSidebar();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 flex justify-between">
          <h2 className="text-lg font-bold text-imos-grey ">IMOS LIVE</h2>
          {open && (
            <Button onClick={toggleSidebar} size="icon" variant="ghost">
              <CloseIcon size="xl" color="imos-grey" />
            </Button>
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
