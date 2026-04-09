import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideDrawer } from "@/components/SideDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2, Shield, FileText, Bell, MessageSquare, Settings,
  Image, BookOpen, ClipboardList, GraduationCap, Users, LayoutDashboard,
  CreditCard,
} from "lucide-react";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { ArticleManagement } from "@/components/admin/ArticleManagement";
import { TestManagement } from "@/components/admin/TestManagement";
import { ExamCategories } from "@/components/admin/ExamCategories";
import { NCERTManagement } from "@/components/admin/NCERTManagement";
import { NotificationManagement } from "@/components/admin/NotificationManagement";
import { PreviousYearQuestions } from "@/components/admin/PreviousYearQuestions";
import { BannerManagement } from "@/components/admin/BannerManagement";
import { ContentRequestsManagement } from "@/components/admin/ContentRequestsManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { PaymentVerification } from "@/components/admin/PaymentVerification";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const adminSections = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "banners", label: "Banners", icon: Image },
  { id: "articles", label: "Articles", icon: FileText },
  { id: "tests", label: "Tests", icon: ClipboardList },
  { id: "exams", label: "Exam Types", icon: GraduationCap },
  { id: "ncert", label: "NCERT", icon: BookOpen },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "previous-papers", label: "PYQs", icon: FileText },
  { id: "requests", label: "Requests", icon: MessageSquare },
];

export default function Admin() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState("settings");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Access denied: Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "settings": return <AdminSettings />;
      case "users": return <UserManagement />;
      case "payments": return <PaymentVerification />;
      case "banners": return <BannerManagement />;
      case "articles": return <ArticleManagement />;
      case "tests": return <TestManagement />;
      case "exams": return <ExamCategories />;
      case "ncert": return <NCERTManagement />;
      case "notifications": return <NotificationManagement />;
      case "previous-papers": return <PreviousYearQuestions />;
      case "requests": return <ContentRequestsManagement />;
      default: return <AdminSettings />;
    }
  };

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="space-y-1 p-2">
      {adminSections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              onItemClick?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <div className="pt-14 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm">Admin Panel</h2>
            </div>
          </div>
          <SidebarNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile header with sidebar trigger */}
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-sm">Admin Panel</h2>
                  </div>
                </div>
                <SidebarNav onItemClick={() => setMobileSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <h2 className="font-semibold text-sm capitalize">
              {adminSections.find((s) => s.id === activeSection)?.label}
            </h2>
          </div>

          <div className="p-4 max-w-5xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
