import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdSense } from "@/hooks/useAdSense";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "premium")
      .maybeSingle()
      .then(({ data }) => setIsPremium(!!data));
  }, [user]);
  return isPremium;
};

export const AdBanner = ({ slot, format = "auto", className = "" }: AdBannerProps) => {
  const isPremium = usePremium();
  const { publisherId } = useAdSense();
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (isPremium || !publisherId) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.log("Ad not loaded:", e);
    }
  }, [isPremium, publisherId]);

  if (isPremium) return null;
  if (!publisherId) return null;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        {!adLoaded && (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <p className="text-xs font-medium">Advertisement</p>
            <p className="text-[10px] mt-1">
              <span className="text-primary cursor-pointer" onClick={() => window.location.href = "/premium"}>
                Go Premium
              </span>{" "}
              for ad-free experience
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const InlineAd = ({ slot, className = "" }: { slot: string; className?: string }) => {
  const isPremium = usePremium();
  const { publisherId } = useAdSense();

  useEffect(() => {
    if (isPremium || !publisherId) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) adsbygoogle.push({});
    } catch (e) {}
  }, [isPremium, publisherId]);

  if (isPremium || !publisherId) return null;

  return (
    <div className={`w-full my-3 ${className}`}>
      <div className="bg-muted/30 border border-border/50 rounded-md p-2 text-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-layout="in-article"
          data-ad-format="fluid"
        />
        <p className="text-[10px] text-muted-foreground">
          Ad • <span className="text-primary cursor-pointer" onClick={() => window.location.href = "/premium"}>Remove ads</span>
        </p>
      </div>
    </div>
  );
};
