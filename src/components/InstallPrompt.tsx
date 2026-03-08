import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, Plus } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const InstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(true);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || !showBanner) return null;

  // Show iOS instructions dialog
  if (isIOS) {
    return (
      <>
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <div>
                 <p className="font-semibold text-sm">Install StudyByte</p>
                <p className="text-xs text-white/80">Get the full app experience</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => setShowIOSDialog(true)}
              >
                Install
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setShowBanner(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Install ExamPulse on iOS</DialogTitle>
              <DialogDescription>
                Follow these steps to add ExamPulse to your home screen:
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
                    ExamPulse will appear on your home screen
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
  }

  // Show install banner for Android/Desktop
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-xl shadow-lg animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Install ExamPulse</p>
            <p className="text-xs text-white/80">Fast access, works offline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90"
            onClick={installApp}
          >
            Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setShowBanner(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
