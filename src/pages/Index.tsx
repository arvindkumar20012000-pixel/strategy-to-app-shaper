import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const articles = [
    {
      id: 1,
      title: "India-Egypt Joint Military Exercise 'Bright Star 2025'",
      date: "2025-08-28",
      category: "Defence",
      description:
        "Indian Armed Forces participate in multinational military exercise Bright Star 2025 in Egypt, strengthening defense cooperation and interoperability.",
      imageUrl: heroBanner,
    },
    {
      id: 2,
      title: "Matsya Shakti Project: Strengthening Coastal Security",
      date: "2025-08-29",
      category: "Security",
      description:
        "Government launches Matsya Shakti project to enhance coastal surveillance and maritime security infrastructure across Indian coastline.",
      imageUrl: heroBanner,
    },
    {
      id: 3,
      title: "The Analyst Handout - Daily Current Affairs",
      date: "2025-08-29",
      category: "Current Affairs",
      description:
        "Comprehensive daily analysis covering national and international events, important for competitive exam preparation.",
      imageUrl: heroBanner,
    },
    {
      id: 4,
      title: "New Education Policy Implementation Progress",
      date: "2025-08-27",
      category: "Education",
      description:
        "Ministry of Education reports significant progress in NEP 2020 implementation across schools and universities nationwide.",
      imageUrl: heroBanner,
    },
  ];

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

        <Tabs defaultValue="today" className="space-y-6">
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

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  date={article.date}
                  category={article.category}
                  description={article.description}
                  imageUrl={article.imageUrl}
                  onBookmark={() => console.log("Bookmark", article.id)}
                  onShare={() => console.log("Share", article.id)}
                  onRead={() => console.log("Read", article.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  date={article.date}
                  category={article.category}
                  description={article.description}
                  imageUrl={article.imageUrl}
                  onBookmark={() => console.log("Bookmark", article.id)}
                  onShare={() => console.log("Share", article.id)}
                  onRead={() => console.log("Read", article.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  title={article.title}
                  date={article.date}
                  category={article.category}
                  description={article.description}
                  imageUrl={article.imageUrl}
                  onBookmark={() => console.log("Bookmark", article.id)}
                  onShare={() => console.log("Share", article.id)}
                  onRead={() => console.log("Read", article.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
