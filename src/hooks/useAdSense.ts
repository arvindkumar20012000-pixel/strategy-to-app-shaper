import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedPublisherId: string | null | undefined = undefined;
let scriptInjected = false;
const listeners: Array<(id: string | null) => void> = [];

export const ADSENSE_SETTING_KEY = "ADSENSE_PUBLISHER_ID";

export const fetchAdsensePublisherId = async (): Promise<string | null> => {
  if (cachedPublisherId !== undefined) return cachedPublisherId;
  try {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", ADSENSE_SETTING_KEY)
      .maybeSingle();
    cachedPublisherId = (data?.value || "").trim() || null;
  } catch {
    cachedPublisherId = null;
  }
  listeners.forEach((cb) => cb(cachedPublisherId!));
  return cachedPublisherId;
};

export const invalidateAdsenseCache = () => {
  cachedPublisherId = undefined;
};

export const injectAdsenseScript = (publisherId: string) => {
  if (scriptInjected) return;
  if (!publisherId.startsWith("ca-pub-")) return;
  if (document.querySelector('script[data-adsense="injected"]')) {
    scriptInjected = true;
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  s.setAttribute("data-adsense", "injected");
  document.head.appendChild(s);
  scriptInjected = true;
};

export const useAdSense = () => {
  const [publisherId, setPublisherId] = useState<string | null>(
    cachedPublisherId ?? null
  );
  const [loading, setLoading] = useState(cachedPublisherId === undefined);

  useEffect(() => {
    let mounted = true;
    if (cachedPublisherId === undefined) {
      fetchAdsensePublisherId().then((id) => {
        if (!mounted) return;
        setPublisherId(id);
        setLoading(false);
        if (id) injectAdsenseScript(id);
      });
    } else if (cachedPublisherId) {
      injectAdsenseScript(cachedPublisherId);
    }
    const cb = (id: string | null) => {
      if (!mounted) return;
      setPublisherId(id);
      if (id) injectAdsenseScript(id);
    };
    listeners.push(cb);
    return () => {
      mounted = false;
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  return { publisherId, loading, scriptInjected };
};
