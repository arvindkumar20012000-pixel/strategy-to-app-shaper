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
        .eq("key", "NEWS_API_KEY")
        .maybeSingle();

      if (error) throw error;
      if (data) setNewsApiKey(data.value || "");
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!newsApiKey) {
      toast.error("Please enter the News API key");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          key: "NEWS_API_KEY",
          value: newsApiKey,
          description: "API key for News API integration",
          updated_by: user?.id,
        }, { onConflict: "key" });

      if (error) throw error;

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
        <div className="p-4 bg-muted rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">
            ✓ AI features are automatically enabled via Lovable AI (includes Google Gemini models)
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
            Get a free key at <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline">newsapi.org</a> for fetching current affairs
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </Card>
  );
}
