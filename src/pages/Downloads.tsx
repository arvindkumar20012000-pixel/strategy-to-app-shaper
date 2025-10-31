import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DownloadItem {
  id: string;
  content_type: string;
  file_name: string;
  downloaded_at: string;
}

export default function Downloads() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDownloads();
    }
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from("downloads")
        .select("*")
        .eq("user_id", user?.id)
        .order("downloaded_at", { ascending: false });

      if (error) throw error;
      setDownloads(data || []);
    } catch (error: any) {
      toast.error("Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <h1 className="text-2xl font-bold mb-6">My Downloads</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : downloads.length > 0 ? (
          <div className="space-y-4">
            {downloads.map((download) => (
              <Card key={download.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">{download.file_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {download.content_type} • Downloaded on{" "}
                        {format(new Date(download.downloaded_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No downloads yet</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
