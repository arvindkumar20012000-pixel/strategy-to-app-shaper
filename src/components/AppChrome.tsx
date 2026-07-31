import { useLocation } from "react-router-dom";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { cn } from "@/lib/utils";

const isBareRoute = (pathname: string) =>
  pathname.startsWith("/auth") ||
  pathname.startsWith("/forgot-password") ||
  pathname.startsWith("/install") ||
  pathname.startsWith("/test/") ||
  pathname.startsWith("/test-taking/") ||
  pathname.startsWith("/exam-instructions");

export const AppChrome = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const bare = isBareRoute(pathname);

  return (
    <div className="overflow-x-hidden w-full">
      {!bare && <DesktopSidebar />}
      <div className={cn(bare ? "" : "lg:pl-64")}>{children}</div>
    </div>
  );
};
