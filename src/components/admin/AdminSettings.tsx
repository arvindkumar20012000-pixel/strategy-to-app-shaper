import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Loader2, DollarSign, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  ADSENSE_SETTING_KEY,
  invalidateAdsenseCache,
  fetchAdsensePublisherId,
  injectAdsenseScript,
} from "@/hooks/useAdSense";

export function AdminSettings() {
  const [newsApiKey, setNewsApiKey] = useState("");
  const [adsenseId, setAdsenseId] = useState("");
  const [savedAdsenseId, setSavedAdsenseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingAds, setSavingAds] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [scriptStatus, setScriptStatus] = useState<"idle" | "loaded" | "failed">("idle");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("key,value")
        .in("key", ["NEWS_API_KEY", ADSENSE_SETTING_KEY]);
      const news = data?.find((d) => d.key === "NEWS_API_KEY");
      const ad = data?.find((d) => d.key === ADSENSE_SETTING_KEY);
      if (news) setNewsApiKey(news.value || "");
      if (ad) {
        setAdsenseId(ad.value || "");
        setSavedAdsenseId(ad.value || "");
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setFetching(false);
    }
  };

  // Detect if AdSense script is loaded
  useEffect(() => {
    if (!savedAdsenseId) return;
    const check = () => {
      if ((window as any).adsbygoogle) setScriptStatus("loaded");
    };
    check();
    const t = setInterval(check, 1000);
    const timeout = setTimeout(() => {
      if (!(window as any).adsbygoogle) setScriptStatus("failed");
    }, 6000);
    return () => {
      clearInterval(t);
      clearTimeout(timeout);
    };
  }, [savedAdsenseId]);

  const handleSaveNews = async () => {
    if (!newsApiKey) return toast.error("Please enter the News API key");
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
      toast.success("News API key saved");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdsense = async () => {
    const trimmed = adsenseId.trim();
    if (!trimmed.startsWith("ca-pub-") || trimmed.length < 15) {
      return toast.error("Publisher ID must look like ca-pub-XXXXXXXXXXXXXXXX");
    }
    setSavingAds(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          key: ADSENSE_SETTING_KEY,
          value: trimmed,
          description: "Google AdSense Publisher ID (ca-pub-...)",
          updated_by: user?.id,
        }, { onConflict: "key" });
      if (error) throw error;
      invalidateAdsenseCache();
      await fetchAdsensePublisherId();
      injectAdsenseScript(trimmed);
      setSavedAdsenseId(trimmed);
      setScriptStatus("idle");
      toast.success("AdSense Publisher ID saved. Ads will start loading.");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    } finally {
      setSavingAds(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const StatusBadge = () => {
    if (!savedAdsenseId)
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5" /> Not configured
        </span>
      );
    if (scriptStatus === "loaded")
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Script loaded
        </span>
      );
    if (scriptStatus === "failed")
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-destructive/15 text-destructive">
          <XCircle className="w-3.5 h-3.5" /> Blocked / failed to load
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Google AdSense (Earn from ads)</h2>
          </div>
          <StatusBadge />
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-muted/60 rounded-md text-sm text-muted-foreground space-y-1">
            <p>1. Apply at <a className="underline text-primary" href="https://adsense.google.com" target="_blank" rel="noopener noreferrer">adsense.google.com</a> and get your site approved.</p>
            <p>2. Copy your Publisher ID (looks like <code className="text-foreground">ca-pub-1234567890123456</code>).</p>
            <p>3. Paste it below — ads will start showing to non-premium users.</p>
          </div>

          <div>
            <Label htmlFor="adsense-id">AdSense Publisher ID</Label>
            <Input
              id="adsense-id"
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              value={adsenseId}
              onChange={(e) => setAdsenseId(e.target.value)}
            />
            {savedAdsenseId && (
              <p className="text-xs text-muted-foreground mt-1">
                Currently active: <code>{savedAdsenseId}</code>
              </p>
            )}
          </div>

          <Button onClick={handleSaveAdsense} disabled={savingAds} className="w-full">
            {savingAds ? "Saving..." : "Save AdSense ID"}
          </Button>

          {scriptStatus === "failed" && (
            <p className="text-xs text-destructive">
              The AdSense script didn't load. This is usually caused by an ad blocker
              in your browser — real users without blockers will still see ads.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">News API</h2>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
            ✓ AI features are auto-enabled via Lovable AI (Gemini models).
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
              Get a free key at <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline">newsapi.org</a>.
            </p>
          </div>

          <Button onClick={handleSaveNews} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save News API Key"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
