import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Loader2 } from "lucide-react";

export function AdminSettings() {
  const [apiKey, setApiKey] = useState("");
  const [newsApiKey, setNewsApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("key", ["LOVABLE_API_KEY", "NEWS_API_KEY"]);

      if (error) throw error;

      const lovableKey = data?.find((s) => s.key === "LOVABLE_API_KEY");
      const newsKey = data?.find((s) => s.key === "NEWS_API_KEY");

      if (lovableKey) setApiKey(lovableKey.value || "");
      if (newsKey) setNewsApiKey(newsKey.value || "");
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey || !newsApiKey) {
      toast.error("Please fill in all API keys");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const settings = [
        {
          key: "LOVABLE_API_KEY",
          value: apiKey,
          description: "API key for Lovable AI integration",
          updated_by: user?.id,
        },
        {
          key: "NEWS_API_KEY",
          value: newsApiKey,
          description: "API key for News API integration",
          updated_by: user?.id,
        },
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert(setting, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Key className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">API Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="lovable-api-key">Lovable AI API Key</Label>
          <Input
            id="lovable-api-key"
            type="password"
            placeholder="Enter Lovable AI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Used for generating AI mock tests and current affairs content
          </p>
        </div>

        <div>
          <Label htmlFor="news-api-key">News API Key</Label>
          <Input
            id="news-api-key"
            type="password"
            placeholder="Enter News API key"
            value={newsApiKey}
            onChange={(e) => setNewsApiKey(e.target.value)}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Used for fetching current affairs articles
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </Card>
  );
}
