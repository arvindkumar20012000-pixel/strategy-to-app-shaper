import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, Plus, Zap, Wifi, Bell } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISS_KEY = "studybyte_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export const InstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showPopup, setShowPopup] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    if (!isInstallable && !isIOS) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_COOLDOWN_MS) {
      return;
    }

    // Small delay so the popup doesn't block first paint
    const timer = setTimeout(() => setShowPopup(true), 1500);
    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPopup(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowPopup(false);
      setShowIOSDialog(true);
      return;
    }
    const accepted = await installApp();
    if (accepted) {
      setShowPopup(false);
    } else {
      handleDismiss();
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <Dialog open={showPopup} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden border-0">
          <div className="bg-gradient-to-br from-primary to-purple-600 p-6 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Install StudyByte</h2>
                <p className="text-xs text-white/80">Free • Quick install</p>
              </div>
            </div>
            <p className="text-sm text-white/90">
              Add StudyByte to your home screen for the best learning experience.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-background">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium">Lightning fast access</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium">Works offline</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium">Native app feel</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Not now
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install StudyByte on iOS</DialogTitle>
            <DialogDescription>
              Follow these steps to add StudyByte to your home screen:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Share className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">1. Tap the Share button</p>
                <p className="text-sm text-muted-foreground">
                  Find it at the bottom of Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">2. Tap "Add to Home Screen"</p>
                <p className="text-sm text-muted-foreground">
                  Scroll down in the share menu to find it
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">3. Tap "Add"</p>
                <p className="text-sm text-muted-foreground">
                  StudyByte will appear on your home screen
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowIOSDialog(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
