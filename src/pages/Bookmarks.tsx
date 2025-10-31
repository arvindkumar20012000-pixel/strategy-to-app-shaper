import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  image_url: string;
  published_date: string;
  category: string;
}

export default function Bookmarks() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("article_id, articles(*)")
        .eq("user_id", user?.id);

      if (error) throw error;

      const bookmarkedArticles = data
        .map((bookmark: any) => bookmark.articles)
        .filter(Boolean);
      setArticles(bookmarkedArticles);
    } catch (error: any) {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async (articleId: string) => {
    setArticles((prev) => prev.filter((article) => article.id !== articleId));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <h1 className="text-2xl font-bold mb-6">My Bookmarks</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                onBookmarkToggle={() => handleBookmarkToggle(article.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No bookmarks yet</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
