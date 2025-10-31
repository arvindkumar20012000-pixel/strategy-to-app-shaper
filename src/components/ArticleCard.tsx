import { useState, useEffect } from "react";
import { Bookmark, Clock } from "lucide-react";
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
}

export const ArticleCard = ({
  id,
  title,
  description,
  image_url,
  published_date,
  category,
  onBookmarkToggle,
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

  const handleBookmark = async () => {
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      {image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(published_date), "MMM dd, yyyy")}
          </div>
        </div>
        <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>
        <Button onClick={handleBookmark} variant="outline" size="sm" className="w-full">
          <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-primary" : ""}`} />
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </Button>
      </CardContent>
    </Card>
  );
};
