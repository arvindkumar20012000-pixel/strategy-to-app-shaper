import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Clock, Target, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MockTest {
  id: string;
  title: string;
  subject: string;
  questions_count: number;
  duration_minutes: number;
  difficulty: string | null;
}

interface PausedTest {
  attemptId: string;
  testId: string;
  type: string;
  timeLeft: number;
  answeredCount: number;
  testName?: string;
}

const MockTest = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [tests, setTests] = useState<MockTest[]>([]);
  const [pausedTests, setPausedTests] = useState<PausedTest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const subjects = [
    "History",
    "Geography",
    "Civics",
    "Economics",
    "Mathematics",
    "Hindi",
    "English",
    "Sanskrit",
    "CDP",
  ];

  useEffect(() => {
    loadPausedTests();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchTests();
    }
  }, [selectedSubject]);

  const loadPausedTests = async () => {
    const paused: PausedTest[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("paused_test_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          paused.push({
            attemptId: data.attemptId,
            testId: data.testId,
            type: data.type,
            timeLeft: data.timeLeft,
            answeredCount: Object.keys(data.answers || {}).length,
          });
        } catch (e) {
          console.error("Error parsing paused test:", e);
        }
      }
    }

    for (const test of paused) {
      try {
        const table = test.type === "paper" ? "previous_papers" : "mock_tests";
        const { data } = await supabase
          .from(table)
          .select("title, paper_name")
          .eq("id", test.testId)
          .single();

        if (data) {
          test.testName = test.type === "paper" ? (data as any).paper_name : (data as any).title;
        }
      } catch (e) {
        console.error("Error fetching test name:", e);
      }
    }

    setPausedTests(paused);
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("subject", selectedSubject)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast.error("Failed to load tests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeTest = (test: PausedTest) => {
    navigate(`/test/${test.testId}?type=${test.type}&resume=${test.attemptId}`);
  };

  const handleDeletePausedTest = (attemptId: string) => {
    localStorage.removeItem(`paused_test_${attemptId}`);
    setPausedTests(pausedTests.filter(t => t.attemptId !== attemptId));
    toast.success("Paused test deleted");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-3 pt-16 pb-4 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-2xl font-bold">Mock Tests</h1>
          </div>
          <p className="text-muted-foreground">
            Curated mock tests prepared by our team to boost your preparation
          </p>
        </div>

        {/* Paused Tests Section */}
        {pausedTests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-primary">Resume Paused Tests</h2>
            <div className="space-y-3">
              {pausedTests.map((test) => (
                <Card key={test.attemptId} className="border-primary/50 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{test.testName || "Test"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {test.answeredCount} answered • {formatTime(test.timeLeft)} remaining
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleResumeTest(test)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePausedTest(test.attemptId)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 max-w-sm">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tests...</p>
          </div>
        ) : selectedSubject ? (
          tests.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Tests</h2>
              {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg break-words">{test.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {test.questions_count} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.duration_minutes} mins
                      </span>
                      {test.difficulty && (
                        <span className={getDifficultyColor(test.difficulty)}>
                          {test.difficulty}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/test/${test.id}?type=test`)}
                    >
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="w-24 h-24 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Tests Available Yet</h3>
                <p className="text-muted-foreground">
                  Tests for {selectedSubject} are being added. Please check back soon.
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-24 h-24 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a Subject</h3>
              <p className="text-muted-foreground">
                Choose a subject to view available mock tests
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MockTest;