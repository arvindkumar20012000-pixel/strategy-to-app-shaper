import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import heroBanner from "@/assets/hero-banner.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<"english" | "hindi" | "all">("all");

  useEffect(() => {
    if (user) {
      fetchArticles();
      fetchBanners();
    }
  }, [user, filter, selectedLanguage]);

  useEffect(() => {
    if (user) {
      checkAndFetchNews();
    }
  }, [user]);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const checkAndFetchNews = async () => {
    const lastFetchEnglish = localStorage.getItem("lastNewsFetch_english");
    const lastFetchHindi = localStorage.getItem("lastNewsFetch_hindi");
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    // Fetch English news if needed
    if (!lastFetchEnglish || now - parseInt(lastFetchEnglish) > twoHours) {
      await fetchFreshNews("english");
      localStorage.setItem("lastNewsFetch_english", now.toString());
    }

    // Fetch Hindi news if needed
    if (!lastFetchHindi || now - parseInt(lastFetchHindi) > twoHours) {
      await fetchFreshNews("hindi");
      localStorage.setItem("lastNewsFetch_hindi", now.toString());
    }
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(3);

      if (error) throw error;
      if (data && data.length > 0) {
        setBanners(data);
      }
    } catch (error: any) {
      console.error("Failed to load banners:", error);
    }
  };

  const fetchFreshNews = async (language: "english" | "hindi") => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-news", {
        body: { language },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Fetched ${data.articlesCount} new ${language} articles`);
        fetchArticles();
      }
    } catch (error: any) {
      console.error("Error fetching news:", error);
      toast.error(`Failed to fetch ${language} news`);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    const now = Date.now().toString();
    
    // Fetch both English and Hindi news
    await Promise.all([
      fetchFreshNews("english"),
      fetchFreshNews("hindi")
    ]);
    
    localStorage.setItem("lastNewsFetch_english", now);
    localStorage.setItem("lastNewsFetch_hindi", now);
    setLoading(false);
  };

  const getBannerImageUrl = (path: string) => {
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    return data.publicUrl;
  };

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

      setAllArticles(articlesWithBookmarks);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(allArticles, query, selectedCategories, selectedLanguage);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    applyFilters(allArticles, searchQuery, newCategories, selectedLanguage);
  };

  const handleLanguageChange = (lang: "english" | "hindi" | "all") => {
    setSelectedLanguage(lang);
    applyFilters(allArticles, searchQuery, selectedCategories, lang);
  };

  const applyFilters = (
    articlesList: Article[],
    query: string,
    categories: string[],
    language: "english" | "hindi" | "all"
  ) => {
    let filtered = articlesList;

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.description?.toLowerCase().includes(query.toLowerCase()) ||
          article.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply category filter
    if (categories.length > 0) {
      filtered = filtered.filter((article) =>
        categories.includes(article.category)
      );
    }

    // Apply language filter
    if (language !== "all") {
      filtered = filtered.filter((article: any) =>
        article.language === language
      );
    }

    setArticles(filtered);
  };

  const uniqueCategories = Array.from(
    new Set(allArticles.map((article) => article.category))
  );

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Header onMenuClick={() => setDrawerOpen(true)} onSearch={handleSearch} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-4 py-6 w-full">
        {/* Hero Banner Carousel */}
        <div className="mb-6 rounded-lg overflow-hidden relative">
          {banners.length > 0 ? (
            <>
              <img
                src={getBannerImageUrl(banners[currentBannerIndex].image_path)}
                alt={banners[currentBannerIndex].title}
                className="w-full h-48 object-cover transition-opacity duration-500"
              />
              {banners.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentBannerIndex
                          ? "bg-white w-4"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className="rounded-2xl overflow-hidden h-48 relative bg-cover bg-center"
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
          )}
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
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedLanguage === "all" ? "All Languages" : selectedLanguage === "english" ? "English" : "हिंदी"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuCheckboxItem
                    checked={selectedLanguage === "all"}
                    onCheckedChange={() => handleLanguageChange("all")}
                  >
                    All Languages
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLanguage === "english"}
                    onCheckedChange={() => handleLanguageChange("english")}
                  >
                    English
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedLanguage === "hindi"}
                    onCheckedChange={() => handleLanguageChange("hindi")}
                  >
                    हिंदी
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleManualRefresh}
                disabled={loading}
                title="Refresh News"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Filter by Category">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {uniqueCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    id={article.id}
                    title={article.title}
                    published_date={article.published_date}
                    category={article.category}
                    description={article.description || ""}
                    image_url={article.image_url || heroBanner}
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
