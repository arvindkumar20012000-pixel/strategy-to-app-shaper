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
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdBanner } from "@/components/AdBanner";

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

      <main className="max-w-4xl mx-auto px-4 pt-20 pb-6">
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

        {/* Performance Analysis */}
        {(() => {
          const total = attempt.total_questions || 1;
          const correct = attempt.correct_answers || 0;
          const incorrect = attempt.incorrect_answers || 0;
          const skipped = Math.max(0, total - correct - incorrect);
          const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
          const avgTimePerQ = attempt.time_taken_minutes
            ? ((attempt.time_taken_minutes * 60) / total).toFixed(1)
            : "—";
          const level =
            attempt.score >= 80
              ? { label: "Excellent", color: "text-success", icon: Trophy }
              : attempt.score >= 60
              ? { label: "Good", color: "text-secondary", icon: TrendingUp }
              : attempt.score >= 40
              ? { label: "Average", color: "text-warning", icon: AlertTriangle }
              : { label: "Needs Work", color: "text-destructive", icon: AlertTriangle };
          const tips: string[] = [];
          if (skipped / total > 0.15) tips.push("You skipped too many questions — work on time management and attempt all questions.");
          if (accuracy < 60) tips.push("Accuracy is low. Focus on understanding concepts rather than rushing through questions.");
          if (incorrect > correct) tips.push("Revise wrong answers carefully — read explanations below for each missed question.");
          if (attempt.time_taken_minutes && attempt.time_taken_minutes < 5 && total > 10) tips.push("You finished very fast — slow down to read questions carefully.");
          if (tips.length === 0) tips.push("Great consistency! Keep practicing harder mock tests to push your score further.");

          const LevelIcon = level.icon;
          return (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent">
                  <LevelIcon className={`w-8 h-8 ${level.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Performance</p>
                    <p className={`text-xl font-bold ${level.color}`}>{level.label}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-semibold">{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Attempted</span>
                      <span className="font-semibold">{correct + incorrect}/{total}</span>
                    </div>
                    <Progress value={((correct + incorrect) / total) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Skipped</span>
                      <span className="font-semibold">{skipped}</span>
                    </div>
                    <Progress value={(skipped / total) * 100} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-success/10">
                    <p className="text-2xl font-bold text-success">{correct}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <p className="text-2xl font-bold text-destructive">{incorrect}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{avgTimePerQ}<span className="text-sm">s</span></p>
                    <p className="text-xs text-muted-foreground">Avg/Q</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
                  <p className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Where to focus next
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    {tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Ad after results summary */}
        <AdBanner slot="test-result-top" className="mb-6" />

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
                    const isCorrect = option.toUpperCase() === answer.questions.correct_answer;
                    const isSelected = option.toUpperCase() === (answer.selected_answer || "");
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
                  <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
                    <p className="text-sm font-bold mb-2 flex items-center gap-2 text-primary">
                      <Lightbulb className="w-4 h-4" />
                      Explanation
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line break-words">
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
