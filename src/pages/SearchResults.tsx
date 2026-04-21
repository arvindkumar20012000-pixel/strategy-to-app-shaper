import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, BookOpen, ScrollText, ClipboardList } from "lucide-react";

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    articles: any[];
    ncert: any[];
    papers: any[];
    tests: any[];
  }>({ articles: [], ncert: [], papers: [], tests: [] });

  useEffect(() => {
    const query = params.get("q") || "";
    setQ(query);
    if (query.trim().length >= 2) runSearch(query);
  }, [params]);

  const runSearch = async (query: string) => {
    setLoading(true);
    const like = `%${query}%`;
    const [a, n, p, t] = await Promise.all([
      supabase
        .from("articles")
        .select("id, title, category, published_date")
        .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
        .limit(20),
      supabase
        .from("ncert_content")
        .select("id, chapter_name, subject, class_number, chapter_number")
        .or(`chapter_name.ilike.${like},subject.ilike.${like}`)
        .limit(20),
      supabase
        .from("previous_papers")
        .select("id, paper_name, exam_type, year")
        .or(`paper_name.ilike.${like},exam_type.ilike.${like}`)
        .limit(20),
      supabase
        .from("mock_tests")
        .select("id, title, subject, difficulty")
        .or(`title.ilike.${like},subject.ilike.${like}`)
        .limit(20),
    ]);
    setResults({
      articles: a.data || [],
      ncert: n.data || [],
      papers: p.data || [],
      tests: t.data || [],
    });
    setLoading(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) setParams({ q: q.trim() });
  };

  const total =
    results.articles.length +
    results.ncert.length +
    results.papers.length +
    results.tests.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-3 pt-16 pb-4 space-y-4">
        <form onSubmit={submit} className="flex gap-2 pt-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search across the app…"
          />
          <Button type="submit">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Searching…</p>
        ) : !params.get("q") ? (
          <p className="text-center text-muted-foreground py-8">
            Enter a search term to begin
          </p>
        ) : total === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No results for "{params.get("q")}"
          </p>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All ({total})</TabsTrigger>
              <TabsTrigger value="articles">News ({results.articles.length})</TabsTrigger>
              <TabsTrigger value="ncert">NCERT ({results.ncert.length})</TabsTrigger>
              <TabsTrigger value="papers">PYP ({results.papers.length})</TabsTrigger>
              <TabsTrigger value="tests">Tests ({results.tests.length})</TabsTrigger>
            </TabsList>

            {(["all", "articles", "ncert", "papers", "tests"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-3">
                {(tab === "all" || tab === "articles") &&
                  results.articles.map((r) => (
                    <Card
                      key={`a-${r.id}`}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate("/")}
                    >
                      <CardContent className="py-3 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            News • {r.category}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {(tab === "all" || tab === "ncert") &&
                  results.ncert.map((r) => (
                    <Card
                      key={`n-${r.id}`}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate("/ncert")}
                    >
                      <CardContent className="py-3 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-secondary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.chapter_name}</p>
                          <p className="text-xs text-muted-foreground">
                            NCERT • {r.subject} • Class {r.class_number}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {(tab === "all" || tab === "papers") &&
                  results.papers.map((r) => (
                    <Card
                      key={`p-${r.id}`}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate("/pyp")}
                    >
                      <CardContent className="py-3 flex items-center gap-3">
                        <ScrollText className="w-5 h-5 text-warning shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.paper_name}</p>
                          <p className="text-xs text-muted-foreground">
                            PYP • {r.exam_type} • {r.year}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {(tab === "all" || tab === "tests") &&
                  results.tests.map((r) => (
                    <Card
                      key={`t-${r.id}`}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate("/mock-test")}
                    >
                      <CardContent className="py-3 flex items-center gap-3">
                        <ClipboardList className="w-5 h-5 text-success shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground flex gap-2 items-center">
                            Mock Test • {r.subject}
                            {r.difficulty && (
                              <Badge variant="secondary" className="text-[10px]">
                                {r.difficulty}
                              </Badge>
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default SearchResults;
