import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

export const AdBanner = ({ slot, format = "auto", className = "" }: AdBannerProps) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkPremium = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "premium")
        .maybeSingle();
      setIsPremium(!!data);
    };
    checkPremium();
  }, [user]);

  useEffect(() => {
    if (isPremium) return;
    try {
      // Push ad after component mounts
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.log("Ad not loaded:", e);
    }
  }, [isPremium]);

  // Don't show ads to premium users
  if (isPremium) return null;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Fallback placeholder when AdSense isn't configured yet */}
      <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-6797322781710540"
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

// Smaller inline ad for between list items
export const InlineAd = ({ slot, className = "" }: { slot: string; className?: string }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkPremium = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "premium")
        .maybeSingle();
      setIsPremium(!!data);
    };
    checkPremium();
  }, [user]);

  useEffect(() => {
    if (isPremium) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) adsbygoogle.push({});
    } catch (e) {}
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className={`w-full my-3 ${className}`}>
      <div className="bg-muted/30 border border-border/50 rounded-md p-2 text-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-client="ca-pub-XXXXXXXXXX"
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
