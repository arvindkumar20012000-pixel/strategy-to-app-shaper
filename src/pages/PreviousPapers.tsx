import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Play, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import iconTest from "@/assets/icon-test.png";

interface Paper {
  id: string;
  paper_name: string;
  year: number;
  questions_count: number;
  duration_minutes: number;
  difficulty: string | null;
  pdf_url: string | null;
}

const PreviousPapers = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState("UPSC");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const exams = [
    { id: "UPSC", name: "UPSC" },
    { id: "UPPSC", name: "UPPSC" },
    { id: "SSC", name: "SSC" },
    { id: "Railway", name: "Railway" },
    { id: "Teaching", name: "Teaching" },
    { id: "Banking", name: "Banking" },
  ];

  useEffect(() => {
    fetchPapers();
    setSelectedYear("all");
    setSearchTerm("");
  }, [selectedExam]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("previous_papers")
        .select("*")
        .eq("exam_type", selectedExam)
        .order("year", { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error: any) {
      toast.error("Failed to load papers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a);
    return years;
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const yearOk = selectedYear === "all" || p.year === Number(selectedYear);
      const term = searchTerm.trim().toLowerCase();
      const nameOk = !term || p.paper_name.toLowerCase().includes(term);
      return yearOk && nameOk;
    });
  }, [papers, selectedYear, searchTerm]);

  const handleDownload = async (paperId: string, paperName: string) => {
    if (!user) return;
    try {
      await supabase.from("downloads").insert({
        user_id: user.id,
        content_type: "pyp",
        content_id: paperId,
        file_name: paperName,
      });
      toast.success("Download tracked! PDF feature coming soon");
    } catch (error: any) {
      console.error(error);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    if (!difficulty) return "text-muted-foreground";
    switch (difficulty) {
      case "Easy":
        return "text-success";
      case "Medium":
        return "text-secondary";
      case "Hard":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-3 pt-16 pb-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={iconTest} alt="PYP" className="w-12 h-12" />
            <h1 className="text-2xl font-bold">Previous Year Papers</h1>
          </div>
          <p className="text-muted-foreground">
            Practice with authentic previous year question papers
          </p>
        </div>

        <Tabs value={selectedExam} onValueChange={setSelectedExam} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {exams.map((exam) => (
              <TabsTrigger key={exam.id} value={exam.id} className="flex-1 min-w-fit">
                {exam.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search paper by name..."
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading papers...</p>
            </div>
          ) : filteredPapers.length > 0 ? (
            <div className="space-y-4">
              {filteredPapers.map((paper) => (
                <Card key={paper.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg mb-1 break-words">{paper.paper_name}</CardTitle>
                        <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>Year: {paper.year}</span>
                          <span>•</span>
                          <span>{paper.questions_count} Questions</span>
                          <span>•</span>
                          <span>{paper.duration_minutes} mins</span>
                          {paper.difficulty && (
                            <>
                              <span>•</span>
                              <span className={getDifficultyColor(paper.difficulty)}>
                                {paper.difficulty}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className="shrink-0">{paper.year}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Button
                      className="flex-1 min-w-[140px]"
                      onClick={() =>
                        navigate(
                          `/exam-instructions?paperId=${paper.id}&type=paper&name=${encodeURIComponent(paper.paper_name)}`,
                        )
                      }
                    >
                      <Play className="w-4 h-4" />
                      Attempt Online
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(paper.id, paper.paper_name)}
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <img src={iconTest} alt="PYP" className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Papers Found</h3>
                <p className="text-muted-foreground">
                  {papers.length === 0
                    ? `Papers for ${selectedExam} are being added`
                    : "No papers match your filters. Try clearing the year or search."}
                </p>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default PreviousPapers;
