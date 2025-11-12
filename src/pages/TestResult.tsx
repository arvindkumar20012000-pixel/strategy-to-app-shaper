import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Home,
} from "lucide-react";

interface TestAttempt {
  id: string;
  score: number;
  correct_answers: number;
  incorrect_answers: number;
  total_questions: number;
  time_taken_minutes: number | null;
  completed_at: string;
  test_id: string | null;
  paper_id: string | null;
}

interface UserAnswer {
  id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  questions: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string | null;
  };
}

const TestResult = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");
  const [rank, setRank] = useState(0);

  useEffect(() => {
    if (attemptId && user) {
      fetchResults();
    }
  }, [attemptId, user]);

  const fetchResults = async () => {
    if (!user || !attemptId) return;

    setLoading(true);
    try {
      // Fetch attempt details
      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("id", attemptId)
        .eq("user_id", user.id)
        .single();

      if (attemptError) throw attemptError;
      setAttempt(attemptData);

      // Fetch test/paper name
      if (attemptData.test_id) {
        const { data: testData } = await supabase
          .from("mock_tests")
          .select("title")
          .eq("id", attemptData.test_id)
          .single();
        setTestName(testData?.title || "Mock Test");
      } else if (attemptData.paper_id) {
        const { data: paperData } = await supabase
          .from("previous_papers")
          .select("paper_name")
          .eq("id", attemptData.paper_id)
          .single();
        setTestName(paperData?.paper_name || "Previous Paper");
      }

      // Fetch answers with questions
      const { data: answersData, error: answersError } = await supabase
        .from("user_answers")
        .select(
          `
          *,
          questions (
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            explanation
          )
        `
        )
        .eq("attempt_id", attemptId);

      if (answersError) throw answersError;
      setAnswers(answersData as UserAnswer[]);

      // Calculate rank (simulated based on score)
      const calculatedRank = Math.max(1, Math.floor((100 - attemptData.score) * 10 + Math.random() * 50));
      setRank(calculatedRank);
    } catch (error: any) {
      toast.error("Failed to load results");
      console.error(error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-secondary";
    return "text-destructive";
  };

  const getOptionLabel = (option: string) => {
    const labels: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };
    return labels[option] || option;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Results Summary */}
        <Card className="mb-6 text-center">
          <CardContent className="pt-6">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(attempt.score)}`} />
            <h1 className="text-3xl font-bold mb-2">{attempt.score}%</h1>
            <p className="text-muted-foreground mb-4">{testName}</p>
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-6">
              Rank: #{rank}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-accent">
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold">{attempt.score}%</p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold">{attempt.correct_answers}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="text-xl font-bold">{attempt.incorrect_answers}</p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <Clock className="w-6 h-6 mx-auto mb-2 text-secondary" />
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-xl font-bold">{attempt.time_taken_minutes || 0}m</p>
              </div>
            </div>

            <Button onClick={() => navigate("/")} className="mt-6">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Solutions */}
        <h2 className="text-2xl font-bold mb-4">Detailed Solutions</h2>
        <div className="space-y-4">
          {answers.map((answer, index) => (
            <Card key={answer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex-1">
                    Q{index + 1}. {answer.questions.question_text}
                  </CardTitle>
                  {answer.is_correct ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Incorrect
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {["a", "b", "c", "d"].map((option) => {
                    const isCorrect = option === answer.questions.correct_answer;
                    const isSelected = option === answer.selected_answer;
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border ${
                          isCorrect
                            ? "bg-success/10 border-success"
                            : isSelected
                            ? "bg-destructive/10 border-destructive"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium">{getOptionLabel(option)}.</span>
                          <span>
                            {answer.questions[`option_${option}` as keyof typeof answer.questions]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {answer.questions.explanation && (
                  <div className="p-3 rounded-lg bg-accent">
                    <p className="text-sm font-medium mb-1">Explanation:</p>
                    <p className="text-sm text-muted-foreground">
                      {answer.questions.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default TestResult;
