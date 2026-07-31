import { NavLink, useNavigate } from "react-router-dom";
import {
  Newspaper,
  BookOpen,
  FileText,
  ClipboardCheck,
  Trophy,
  BarChart3,
  Award,
  Bookmark,
  Download,
  History,
  Gift,
  Crown,
  Settings as SettingsIcon,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyByteLogo } from "@/components/StudyByteLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const groups: { label: string; items: { to: string; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "Study",
    items: [
      { to: "/", label: "Current Affairs", icon: Newspaper },
      { to: "/ncert", label: "NCERT", icon: BookOpen },
      { to: "/pyp", label: "Previous Papers", icon: FileText },
      { to: "/mock-test", label: "Mock Tests", icon: ClipboardCheck },
    ],
  },
  {
    label: "Progress",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/achievements", label: "Achievements", icon: Award },
      { to: "/history", label: "Test History", icon: History },
    ],
  },
  {
    label: "Library",
    items: [
      { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
      { to: "/downloads", label: "Downloads", icon: Download },
      { to: "/refer", label: "Refer & Earn", icon: Gift },
      { to: "/premium", label: "Premium", icon: Crown },
    ],
  },
];

export const DesktopSidebar = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-card">
      <div
        className="flex items-center gap-2.5 px-5 h-16 border-b border-border cursor-pointer select-none"
        onClick={() => navigate("/")}
      >
        <StudyByteLogo size={30} />
        <span className="font-display text-2xl leading-none">
          <span className="text-foreground">Study</span>
          <span className="text-primary">Byte</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="truncate">{user?.email ?? "Profile"}</span>
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};
