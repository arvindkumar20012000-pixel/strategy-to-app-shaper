import { useAdSense } from "@/hooks/useAdSense";

/** Mounted once at app root. Loads AdSense script using publisher ID from admin_settings. */
export const AdSenseLoader = () => {
  useAdSense();
  return null;
};
