import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Trash2, Info, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Info; bg: string; border: string; badge: string }> = {
  info: {
    icon: Info,
    bg: "bg-blue-500/5",
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-green-500/5",
    border: "border-l-green-500",
    badge: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-500/5",
    border: "border-l-yellow-500",
    badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-500/5",
    border: "border-l-red-500",
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export default function Notifications() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Get dismissed notification IDs for this user
      let dismissedIds: string[] = [];
      if (user) {
        const { data: dismissed } = await (supabase as any)
          .from("dismissed_notifications")
          .select("notification_id")
          .eq("user_id", user.id);
        dismissedIds = (dismissed || []).map((d: any) => d.notification_id);
      }

      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const filtered = (data || []).filter(
        (n: Notification) => !dismissedIds.includes(n.id)
      );
      setNotifications(filtered);
    } catch (error: any) {
      toast.error("Failed to load notifications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    if (!user) return;
    setDismissing(notificationId);
    try {
      const { error } = await (supabase as any)
        .from("dismissed_notifications")
        .insert({ user_id: user.id, notification_id: notificationId });

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification dismissed");
    } catch (error: any) {
      toast.error("Failed to dismiss notification");
      console.error(error);
    } finally {
      setDismissing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const config = (type: string) => typeConfig[type] || typeConfig.info;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="max-w-screen-md mx-auto px-3 pt-16 pb-4">
        <div className="flex items-center gap-3 py-4 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <BellOff className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                You have no new notifications
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon: Icon, bg, border, badge } = config(notification.type);
              return (
                <Card
                  key={notification.id}
                  className={`p-4 border-l-4 ${border} ${bg} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight">
                          {notification.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider shrink-0 ${badge}`}
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground/70">
                          {formatDate(notification.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => handleDismiss(notification.id)}
                          disabled={dismissing === notification.id}
                        >
                          {dismissing === notification.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Dismiss
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
