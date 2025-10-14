import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}

const TestTaking = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // 'test' or 'paper'
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testName, setTestName] = useState("");
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (id && user) {
      fetchTestData();
    }
  }, [id, user, type]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const fetchTestData = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Fetch test/paper details
      const table = type === "paper" ? "previous_papers" : "mock_tests";
      const { data: testData, error: testError } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (testError) throw testError;

      const name = type === "paper" 
        ? (testData as any).paper_name 
        : (testData as any).title;
      
      setTestName(name);
      setTotalTime(testData.duration_minutes * 60);
      setTimeLeft(testData.duration_minutes * 60);

      // Fetch questions
      const column = type === "paper" ? "paper_id" : "test_id";
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq(column, id);

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        toast.error("No questions available for this test");
        navigate(-1);
        return;
      }

      setQuestions(questionsData);

      // Create test attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .insert({
          user_id: user.id,
          [type === "paper" ? "paper_id" : "test_id"]: id,
          total_questions: questionsData.length,
          score: 0,
          correct_answers: 0,
          incorrect_answers: 0,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attemptData.id);
    } catch (error: any) {
      toast.error("Failed to load test");
      console.error(error);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleSubmit = async () => {
    if (!user || !attemptId) return;

    try {
      // Calculate score
      let correctCount = 0;
      let incorrectCount = 0;

      const userAnswers = questions.map((q) => {
        const selectedAnswer = answers[q.id];
        const isCorrect = selectedAnswer === q.correct_answer;
        if (isCorrect) correctCount++;
        else if (selectedAnswer) incorrectCount++;

        return {
          attempt_id: attemptId,
          question_id: q.id,
          selected_answer: selectedAnswer || null,
          is_correct: isCorrect,
        };
      });

      // Insert user answers
      const { error: answersError } = await supabase
        .from("user_answers")
        .insert(userAnswers);

      if (answersError) throw answersError;

      // Update attempt with final score
      const score = Math.round((correctCount / questions.length) * 100);
      const timeTaken = Math.floor((totalTime - timeLeft) / 60);

      const { error: updateError } = await supabase
        .from("test_attempts")
        .update({
          score,
          correct_answers: correctCount,
          incorrect_answers: incorrectCount,
          time_taken_minutes: timeTaken,
          completed_at: new Date().toISOString(),
        })
        .eq("id", attemptId);

      if (updateError) throw updateError;

      toast.success("Test submitted successfully!");
      navigate(`/test-result/${attemptId}`);
    } catch (error: any) {
      toast.error("Failed to submit test");
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background pb-6">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Test Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">{testName}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2 text-destructive">
                <Clock className="w-5 h-5" />
                <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Answered: {answeredCount}/{questions.length}
            </p>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Q{currentQuestionIndex + 1}. {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={handleAnswerSelect}
              className="space-y-3"
            >
              {["a", "b", "c", "d"].map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem value={option} id={`option-${option}`} />
                  <Label
                    htmlFor={`option-${option}`}
                    className="flex-1 cursor-pointer"
                  >
                    {currentQuestion[`option_${option}` as keyof Question]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  idx === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[questions[idx].id]
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit}>Submit Test</Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TestTaking;
