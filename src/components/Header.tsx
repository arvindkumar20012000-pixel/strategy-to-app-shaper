import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMenuClick: () => void;
  showSearch?: boolean;
}

export const Header = ({ onMenuClick, showSearch = true }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ExamPulse
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
};
