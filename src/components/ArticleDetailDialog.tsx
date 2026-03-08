import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark, Share2, Calendar, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface ArticleBasic {
  id: string;
  title: string;
  description: string | null;
  category: string;
  published_date: string;
  image_url: string | null;
}

interface ArticleDetails extends ArticleBasic {
  content: string | null;
  source: string | null;
}

interface ArticleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string | null;
  articles: ArticleBasic[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export const ArticleDetailDialog = ({
  open,
  onOpenChange,
  articleId,
  articles,
  currentIndex,
  onNavigate,
}: ArticleDetailDialogProps) => {
  const [articleDetails, setArticleDetails] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && articleId) {
      fetchArticle(articleId);
      if (user) checkBookmark(articleId);
    }
  }, [articleId, open]);

  const fetchArticle = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setArticleDetails(data);
    } catch {
      toast.error("Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async (id: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("article_id", id)
      .eq("user_id", user?.id)
      .maybeSingle();
    setIsBookmarked(!!data);
  };

  const handleBookmark = async () => {
    if (!user || !articleId) return;
    try {
      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("article_id", articleId).eq("user_id", user.id);
        toast.success("Bookmark removed");
      } else {
        await supabase.from("bookmarks").insert({ article_id: articleId, user_id: user.id });
        toast.success("Article bookmarked");
      }
      setIsBookmarked(!isBookmarked);
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const handleShare = () => {
    const shareData = { title: articleDetails?.title || "", text: articleDetails?.description || "", url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    }
  };

  const goNext = useCallback(() => {
    if (currentIndex < articles.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, articles.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only swipe if horizontal movement is dominant and > 60px
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < articles.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] p-0"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation indicator */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={!hasPrev}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            {currentIndex + 1} / {articles.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={!hasNext}
            className="gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : articleDetails ? (
            <>
              <DialogHeader>
                <div className="space-y-3">
                  <Badge className="w-fit">{articleDetails.category}</Badge>
                  <DialogTitle className="text-2xl leading-tight break-words">
                    {articleDetails.title}
                  </DialogTitle>
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
                  className="w-full h-64 object-cover rounded-lg mt-4"
                />
              )}

              <div className="space-y-4 mt-4">
                {articleDetails.content && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {articleDetails.content.split("\n").map((line, index) => {
                      const t = line.trim();
                      if (!t) return <div key={index} className="h-2" />;
                      if (t.startsWith("## "))
                        return <h3 key={index} className="text-lg font-semibold text-foreground mt-4 mb-2">{t.replace("## ", "")}</h3>;
                      if (t.startsWith("# "))
                        return <h2 key={index} className="text-xl font-bold text-foreground mt-4 mb-2">{t.replace("# ", "")}</h2>;
                      if (/^[•\-\*]\s/.test(t))
                        return (
                          <div key={index} className="flex items-start gap-2 ml-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-foreground">{t.replace(/^[•\-\*]\s*/, "")}</span>
                          </div>
                        );
                      return <p key={index} className="text-foreground break-words">{t}</p>;
                    })}
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

              {/* Swipe hint on mobile */}
              <p className="text-center text-[10px] text-muted-foreground/50 mt-6 sm:hidden">
                ← Swipe to navigate →
              </p>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
