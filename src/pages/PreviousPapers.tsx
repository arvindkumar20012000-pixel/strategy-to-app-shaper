import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Play } from "lucide-react";
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

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={iconTest} alt="PYP" className="w-12 h-12" />
            <h1 className="text-2xl font-bold">Previous Year Papers</h1>
          </div>
          <p className="text-muted-foreground">
            Practice with authentic previous year question papers
          </p>
        </div>

        <Tabs value={selectedExam} onValueChange={setSelectedExam} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {exams.map((exam) => (
              <TabsTrigger key={exam.id} value={exam.id} className="flex-1 min-w-fit">
                {exam.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading papers...</p>
            </div>
          ) : papers.length > 0 ? (
            <div className="space-y-4">
              {papers.map((paper) => (
                <Card key={paper.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">{paper.paper_name}</CardTitle>
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
                      <Badge>{paper.year}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => navigate(`/test/${paper.id}?type=paper`)}
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
                <h3 className="text-lg font-semibold mb-2">No Papers Available</h3>
                <p className="text-muted-foreground">
                  Papers for {selectedExam} are being added
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
