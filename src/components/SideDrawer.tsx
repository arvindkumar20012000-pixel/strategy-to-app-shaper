import {
  Home,
  User,
  Crown,
  HelpCircle,
  Bookmark,
  Download,
  History,
  Radio,
  FileQuestion,
  Moon,
  CreditCard,
  MessageCircle,
  Facebook,
  Instagram,
  Send,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: <Home />, label: "Home", path: "/" },
  { icon: <User />, label: "My Profile", path: "/profile" },
  { icon: <Crown />, label: "Premium", path: "/premium", highlight: true },
  { icon: <HelpCircle />, label: "Doubt Clearance", path: "/doubt-clearance" },
  { icon: <Bookmark />, label: "My Bookmarks", path: "/bookmarks" },
  { icon: <Download />, label: "My Downloads", path: "/downloads" },
  { icon: <History />, label: "Attempt History", path: "/history" },
  { icon: <Radio />, label: "Live Tests", path: "/live-tests" },
  { icon: <FileQuestion />, label: "Request Special Content", path: "/request-content" },
];

const bottomMenuItems = [
  { icon: <Moon />, label: "Turn Night Mode On", action: "toggle-theme" },
  { icon: <CreditCard />, label: "Transactions", path: "/transactions" },
  { icon: <MessageCircle />, label: "FAQs", path: "/faqs" },
  { icon: <MessageCircle />, label: "Contact Us", path: "/contact" },
  { icon: <Shield />, label: "Privacy Policy", path: "/privacy" },
  { icon: <Settings />, label: "Settings", path: "/settings" },
];

const socialLinks = [
  { icon: <Facebook />, label: "Facebook", url: "#" },
  { icon: <Instagram />, label: "Instagram", url: "#" },
  { icon: <Send />, label: "Telegram", url: "#" },
];

export const SideDrawer = ({ isOpen, onClose }: SideDrawerProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleAction = (action: string) => {
    if (action === "toggle-theme") {
      setTheme(theme === "dark" ? "light" : "dark");
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">EP</span>
              </div>
              <div>
                <div className="text-lg font-bold">ExamPulse</div>
                <div className="text-sm text-muted-foreground truncate">
                  {user?.email || "Your Exam Partner"}
                </div>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                item.highlight ? "text-secondary hover:text-secondary" : ""
              }`}
              onClick={() => item.path && handleNavigation(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.highlight && <Crown className="ml-auto w-4 h-4" />}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {bottomMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                if ((item as any).action) handleAction((item as any).action as string);
                else if ((item as any).path) handleNavigation((item as any).path as string);
              }}
            >
              {item.icon}
              <span>
                {"action" in item && item.action === "toggle-theme"
                  ? theme === "dark"
                    ? "Turn Night Mode Off"
                    : "Turn Night Mode On"
                  : item.label}
              </span>
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut />
            <span>Sign Out</span>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-2">Follow Us</p>
          <div className="flex gap-2">
            {socialLinks.map((social, index) => (
              <Button key={index} variant="outline" size="icon">
                {social.icon}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-primary rounded-lg text-white">
          <h3 className="font-bold mb-2">Upgrade to Premium</h3>
          <p className="text-sm text-white/90 mb-3">
            Get unlimited access to all features
          </p>
          <Button variant="secondary" className="w-full">
            Upgrade Now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
