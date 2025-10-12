import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Play } from "lucide-react";
import iconTest from "@/assets/icon-test.png";

const PreviousPapers = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const exams = [
    { id: "upsc", name: "UPSC", count: 45 },
    { id: "uppsc", name: "UPPSC", count: 38 },
    { id: "ssc", name: "SSC", count: 52 },
    { id: "railway", name: "Railway", count: 41 },
    { id: "teaching", name: "Teaching", count: 33 },
    { id: "banking", name: "Banking", count: 47 },
  ];

  const papers = [
    { id: 1, year: 2024, name: "UPSC Prelims GS Paper I", questions: 100, duration: "2 hours" },
    { id: 2, year: 2024, name: "UPSC Prelims GS Paper II", questions: 80, duration: "2 hours" },
    { id: 3, year: 2023, name: "UPSC Prelims GS Paper I", questions: 100, duration: "2 hours" },
    { id: 4, year: 2023, name: "UPSC Prelims GS Paper II", questions: 80, duration: "2 hours" },
  ];

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

        <Tabs defaultValue="upsc" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {exams.map((exam) => (
              <TabsTrigger key={exam.id} value={exam.id} className="flex-1 min-w-fit">
                {exam.name}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {exam.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {exams.map((exam) => (
            <TabsContent key={exam.id} value={exam.id} className="space-y-4">
              {papers.map((paper) => (
                <Card key={paper.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1">{paper.name}</CardTitle>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>Year: {paper.year}</span>
                          <span>•</span>
                          <span>{paper.questions} Questions</span>
                          <span>•</span>
                          <span>{paper.duration}</span>
                        </div>
                      </div>
                      <Badge>{paper.year}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button className="flex-1">
                      <Play className="w-4 h-4" />
                      Attempt Online
                    </Button>
                    <Button variant="secondary">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default PreviousPapers;
