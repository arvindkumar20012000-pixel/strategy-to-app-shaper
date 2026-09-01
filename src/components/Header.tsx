import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { StudyByteLogo } from "@/components/StudyByteLogo";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const Header = ({ onMenuClick, showSearch = true, onSearch }: HeaderProps) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const goGlobalSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 lg:left-64 z-50 w-full lg:w-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-3 py-2 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="shrink-0 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer select-none lg:hidden" onClick={() => navigate('/')}>
              <StudyByteLogo size={32} className="shrink-0" />
              <h1 className="font-display text-2xl leading-none">
                <span className="text-foreground">Study</span>
                <span className="text-primary">Byte</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showSearch && (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </Button>
            )}
            {user ? (
              <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
                <Bell className="w-5 h-5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Search Articles</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search articles, NCERT, PYP, tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {onSearch && (
              <Button
                variant="link"
                className="px-0 h-auto text-xs"
                onClick={goGlobalSearch}
              >
                Search across all content →
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
