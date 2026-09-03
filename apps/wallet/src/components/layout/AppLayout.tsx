import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import AppBottomNav from "./AppBottomNav";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className={cn(
        "relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 md:pb-8 transition-all duration-300",
        collapsed ? "md:pl-16" : "md:pl-64"
      )}>
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <AppBottomNav />
    </div>
  );
};

export default AppLayout;
