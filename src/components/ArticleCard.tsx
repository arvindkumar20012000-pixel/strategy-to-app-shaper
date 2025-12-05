import { useState, useEffect } from "react";
import { Bookmark, Clock, Share2, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

interface ArticleDetails {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  published_date: string;
  image_url: string | null;
  source: string | null;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [articleDetails, setArticleDetails] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleCardClick = async () => {
    setLoading(true);
    setDialogOpen(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setArticleDetails(data);
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Failed to load article details");
    } finally {
      setLoading(false);
    }
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
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer w-full max-w-full" onClick={handleCardClick}>
        {image_url && (
          <div className="h-48 overflow-hidden">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs shrink-0">{category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {format(new Date(published_date), "MMM dd, yyyy")}
            </div>
          </div>
          <h3 className="text-lg font-semibold line-clamp-2 break-words">{title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 break-words">{description}</p>
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

      {/* Article Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : articleDetails ? (
            <>
              <DialogHeader>
                <div className="space-y-3">
                  <Badge className="w-fit">{articleDetails.category}</Badge>
                  <DialogTitle className="text-2xl leading-tight break-words">{articleDetails.title}</DialogTitle>
                  {articleDetails.description && (
                    <DialogDescription className="text-base break-words">
                      {articleDetails.description}
                    </DialogDescription>
                  )}
                </div>
              </DialogHeader>
              
              {articleDetails.image_url && (
                <img 
                  src={articleDetails.image_url} 
                  alt={articleDetails.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                {articleDetails.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap break-words">{articleDetails.content}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    {articleDetails.source && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span className="truncate">Source: {articleDetails.source}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{format(new Date(articleDetails.published_date), "MMMM dd, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBookmark}>
                      <Bookmark className={`w-4 h-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
                      {isBookmarked ? "Saved" : "Save"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};