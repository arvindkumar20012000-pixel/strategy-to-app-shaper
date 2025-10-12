import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import heroBanner from "@/assets/hero-banner.jpg";

interface Article {
  id: string;
  title: string;
  description: string | null;
  category: string;
  published_date: string;
  image_url: string | null;
  isBookmarked?: boolean;
}

const Index = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user, filter]);

  const fetchArticles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const daysAgo = filter === "today" ? 1 : filter === "week" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("*")
        .gte("published_date", startDate.toISOString().split("T")[0])
        .order("published_date", { ascending: false });

      if (articlesError) throw articlesError;

      // Fetch user's bookmarks
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select("article_id")
        .eq("user_id", user.id);

      if (bookmarksError) throw bookmarksError;

      const bookmarkedIds = new Set(
        bookmarksData?.map((b) => b.article_id) || []
      );

      const articlesWithBookmarks = articlesData?.map((article) => ({
        ...article,
        isBookmarked: bookmarkedIds.has(article.id),
      })) || [];

      setArticles(articlesWithBookmarks);
    } catch (error: any) {
      toast.error("Failed to load articles");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (articleId: string) => {
    if (!user) return;

    try {
      const article = articles.find((a) => a.id === articleId);
      if (!article) return;

      if (article.isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleId);

        if (error) throw error;
        toast.success("Bookmark removed");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, article_id: articleId });

        if (error) throw error;
        toast.success("Article bookmarked");
      }

      // Update local state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId ? { ...a, isBookmarked: !a.isBookmarked } : a
        )
      );
    } catch (error: any) {
      toast.error("Failed to update bookmark");
      console.error(error);
    }
  };

  const handleShare = (article: Article) => {
    const shareData = {
      title: article.title,
      text: article.description || "",
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div
          className="rounded-2xl overflow-hidden mb-6 h-48 relative bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-90" />
          <div className="relative h-full flex flex-col justify-center items-center text-white text-center p-6">
            <h2 className="text-3xl font-bold mb-2">Welcome to ExamPulse</h2>
            <p className="text-white/90 max-w-md">
              Your daily dose of current affairs and exam preparation
            </p>
          </div>
        </div>

        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">7 Days</TabsTrigger>
              <TabsTrigger value="month">30 Days</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          <TabsContent value={filter} className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No articles found for the selected period
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    date={article.published_date}
                    category={article.category}
                    description={article.description || ""}
                    imageUrl={article.image_url || heroBanner}
                    isBookmarked={article.isBookmarked}
                    onBookmark={() => handleBookmark(article.id)}
                    onShare={() => handleShare(article)}
                    onRead={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
