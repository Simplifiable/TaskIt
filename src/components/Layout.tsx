import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { SidebarNav } from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    }
  };

  const SidebarContentComponent = () => (
    <>
      <SidebarHeader className="flex items-center justify-between px-4">
        <span className="text-lg font-semibold">Task Manager</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
    </>
  );

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex min-h-screen w-full">
        {isMobile ? (
          <div className="fixed top-0 left-0 z-50 w-full bg-background border-b p-2 flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar className="border-0 w-full">
                  <SidebarContentComponent />
                </Sidebar>
              </SheetContent>
            </Sheet>
            <span className="text-lg font-semibold flex-1">Task Manager</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
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
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </div>
          </div>
        ) : (
          <Sidebar>
            <SidebarContentComponent />
          </Sidebar>
        )}
        <div className={`flex-1 ${isMobile ? "pt-16" : ""} p-8`}>
          {!isMobile && (
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
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}