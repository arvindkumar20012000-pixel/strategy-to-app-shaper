import { Download, Smartphone, Zap, Wifi, Share, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

const Install = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant loading with app-like performance"
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "Access your study materials without internet"
    },
    {
      icon: Smartphone,
      title: "Native Experience",
      description: "Full screen mode, just like a real app"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => {}} onSearch={() => {}} />
      
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Install StudyByte</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {/* Status Card */}
        {isInstalled ? (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-full">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-600">Already Installed!</p>
                  <p className="text-sm text-muted-foreground">
                    StudyByte is ready on your device
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Install on iOS</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">1. Tap the Share button</p>
                    <p className="text-sm text-muted-foreground">
                      Located at the bottom of Safari browser
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">2. Select "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground">
                      Scroll down in the share menu to find it
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">3. Tap "Add" to confirm</p>
                    <p className="text-sm text-muted-foreground">
                      StudyByte will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Button 
            onClick={installApp} 
            className="w-full mb-6 h-14 text-lg"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Install App
          </Button>
        ) : (
          <Card className="mb-6 border-muted">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2 rounded-full">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Installation Not Available</p>
                  <p className="text-sm text-muted-foreground">
                    Open in Chrome or Safari to install
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4">Why Install?</h3>
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Install;
