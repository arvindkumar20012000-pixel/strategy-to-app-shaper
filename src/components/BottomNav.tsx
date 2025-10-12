import { Newspaper, BookOpen, FileText, ClipboardCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    icon: <Newspaper className="w-5 h-5" />,
    label: "Feed",
    path: "/",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "NCERT",
    path: "/ncert",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: "PYP",
    path: "/pyp",
  },
  {
    icon: <ClipboardCheck className="w-5 h-5" />,
    label: "Mock Test",
    path: "/mock-test",
  },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex items-center justify-around max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
