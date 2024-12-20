import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { SidebarNav } from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex min-h-screen w-full">
        <Sidebar defaultCollapsed={false}>
          <SidebarHeader className="flex items-center justify-between px-4">
            <span className="text-lg font-semibold">Task Manager</span>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 p-8">
          <div className="mb-6 flex justify-end items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
            <NotificationsPopover />
          </div>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}