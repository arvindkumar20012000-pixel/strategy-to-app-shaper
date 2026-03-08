import { useState, useEffect } from "react";
import { Bookmark, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export interface ArticleCardProps {
  id: string;
  title: string;
  description: string;
  image_url: string;
  published_date: string;
  category: string;
  onBookmarkToggle?: () => void;
  onOpen?: () => void;
}

export const ArticleCard = ({
  id,
  title,
  description,
  image_url,
  published_date,
  category,
  onBookmarkToggle,
  onOpen,
}: ArticleCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkBookmark();
    }
  }, [user, id]);

  const checkBookmark = async () => {
    try {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();
      setIsBookmarked(!!data);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    }
  };

  const handleCardClick = () => {
    onOpen?.();
  };

  const handleBookmark = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast.error("Please login to bookmark articles");
      return;
    }

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("article_id", id)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Bookmark removed");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ article_id: id, user_id: user.id });
        if (error) throw error;
        toast.success("Article bookmarked");
      }
      setIsBookmarked(!isBookmarked);
      onBookmarkToggle?.();
    } catch (error: any) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, text: description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer w-full max-w-full" onClick={handleCardClick}>
      {image_url && (
        <div className="h-36 sm:h-40 overflow-hidden">
          <img src={image_url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="space-y-1.5 p-3 pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs shrink-0">{category}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {format(new Date(published_date), "MMM dd, yyyy")}
          </div>
        </div>
        <h3 className="text-lg font-semibold line-clamp-2 break-words">{title}</h3>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words">{description}</p>
        <div className="flex gap-2">
          <Button onClick={handleBookmark} variant="outline" size="sm" className="flex-1 min-w-0">
            <Bookmark className={`w-4 h-4 mr-2 shrink-0 ${isBookmarked ? "fill-primary" : ""}`} />
            <span className="truncate">{isBookmarked ? "Saved" : "Save"}</span>
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm" className="shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
