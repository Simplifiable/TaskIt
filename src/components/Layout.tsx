import { Sidebar } from "@/components/ui/sidebar";
import { NotificationsPopover } from "@/components/NotificationsPopover";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-end">
          <NotificationsPopover />
        </div>
        {children}
      </div>
    </div>
  );
}