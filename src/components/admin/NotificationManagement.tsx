import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Plus, Loader2, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  is_active: boolean;
  created_at: string;
}

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetAudience, setTargetAudience] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to load notifications");
    } finally {
      setFetching(false);
    }
  };

  const handleAddNotification = async () => {
    if (!title || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("notifications").insert({
        title,
        message,
        type,
        target_audience: targetAudience,
        is_active: true,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Notification created successfully");
      setTitle("");
      setMessage("");
      setType("info");
      setTargetAudience("all");
      await fetchNotifications();
    } catch (error: any) {
      toast.error("Failed to create notification: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Notification status updated");
      await fetchNotifications();
    } catch (error: any) {
      toast.error("Failed to update notification");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Notification deleted");
      await fetchNotifications();
    } catch (error: any) {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Notification Management</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium Users</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAddNotification} disabled={loading} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Notification"}
          </Button>
        </div>
      </Card>

      {fetching ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Notifications</h3>
          {notifications.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No notifications yet. Create your first notification above.
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Target: {notification.target_audience}</span>
                      <span>Created: {new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${notification.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${notification.id}`}
                        checked={notification.is_active}
                        onCheckedChange={() => handleToggleActive(notification.id, notification.is_active)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
