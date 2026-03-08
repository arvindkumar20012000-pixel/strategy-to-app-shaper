import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import studyByteLogo from "@/assets/studybyte-logo.png";

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
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-3 py-2 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={studyByteLogo} alt="StudyByte" className="w-8 h-8" />
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                StudyByte
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showSearch && (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Search Articles</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Search for articles, news, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
