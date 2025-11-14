import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideDrawer } from "@/components/SideDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Shield, FileText, Bell } from "lucide-react";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { ArticleManagement } from "@/components/admin/ArticleManagement";
import { TestManagement } from "@/components/admin/TestManagement";
import { ExamCategories } from "@/components/admin/ExamCategories";
import { NCERTManagement } from "@/components/admin/NCERTManagement";
import { NotificationManagement } from "@/components/admin/NotificationManagement";
import { PreviousYearQuestions } from "@/components/admin/PreviousYearQuestions";
import { BannerManagement } from "@/components/admin/BannerManagement";

export default function Admin() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="exams">Exam Types</TabsTrigger>
            <TabsTrigger value="ncert">NCERT</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="previous-papers">
              <FileText className="h-4 w-4 mr-2" />
              PYQs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="banners">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="articles">
            <ArticleManagement />
          </TabsContent>

          <TabsContent value="tests">
            <TestManagement />
          </TabsContent>

          <TabsContent value="exams">
            <ExamCategories />
          </TabsContent>

          <TabsContent value="ncert">
            <NCERTManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>

          <TabsContent value="previous-papers">
            <PreviousYearQuestions />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
