import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight, Grid3x3, Pause, Play } from "lucide-react";

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

interface PausedTestState {
  attemptId: string;
  testId: string;
  type: string;
  answers: Record<string, string>;
  markedForReview: string[];
  currentQuestionIndex: number;
  timeLeft: number;
}

const TestTaking = () => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // 'test' or 'paper'
  const resumeAttemptId = searchParams.get("resume");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testName, setTestName] = useState("");
  const [totalTime, setTotalTime] = useState(0);

  // Prevent navigation away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isPaused && questions.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPaused, questions.length]);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.log("Fullscreen not supported or denied");
      }
    };
    
    if (!loading && questions.length > 0) {
      enterFullscreen();
    }
  }, [loading, questions.length]);

  useEffect(() => {
    if (id && user) {
      if (resumeAttemptId) {
        resumeTest();
      } else {
        fetchTestData();
      }
    }
  }, [id, user, type, resumeAttemptId]);

  useEffect(() => {
    if (timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0 && !loading) {
      handleSubmit();
    }
  }, [timeLeft, isPaused]);

  const resumeTest = async () => {
    if (!user || !id || !resumeAttemptId) return;

    setLoading(true);
    try {
      // Get saved state from localStorage
      const savedState = localStorage.getItem(`paused_test_${resumeAttemptId}`);
      if (!savedState) {
        toast.error("Could not find saved test state");
        navigate("/mock-test");
        return;
      }

      const pausedState: PausedTestState = JSON.parse(savedState);
      
      // Fetch test details
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

      // Fetch questions
      const column = type === "paper" ? "paper_id" : "test_id";
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq(column, id);

      if (questionsError) throw questionsError;

      setQuestions(questionsData || []);
      setAttemptId(pausedState.attemptId);
      setAnswers(pausedState.answers);
      setMarkedForReview(new Set(pausedState.markedForReview));
      setCurrentQuestionIndex(pausedState.currentQuestionIndex);
      setTimeLeft(pausedState.timeLeft);
      
      // Clear saved state
      localStorage.removeItem(`paused_test_${resumeAttemptId}`);
      
      toast.success("Test resumed!");
    } catch (error: any) {
      toast.error("Failed to resume test");
      console.error(error);
      navigate("/mock-test");
    } finally {
      setLoading(false);
    }
  };

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

  const toggleMarkForReview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestion.id)) {
      newMarked.delete(currentQuestion.id);
    } else {
      newMarked.add(currentQuestion.id);
    }
    setMarkedForReview(newMarked);
  };

  const getQuestionStatus = (questionId: string) => {
    const isAnswered = !!answers[questionId];
    const isMarked = markedForReview.has(questionId);
    
    if (isAnswered && isMarked) return "answered-marked";
    if (isAnswered) return "answered";
    if (isMarked) return "marked";
    return "not-answered";
  };

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2";
    
    switch (status) {
      case "answered":
        return "bg-green-500 text-white";
      case "marked":
        return "bg-purple-500 text-white";
      case "answered-marked":
        return "bg-yellow-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handlePauseClick = () => {
    setPauseDialogOpen(true);
  };

  const handlePauseTest = () => {
    setIsPaused(true);
    setPauseDialogOpen(false);
    
    // Save state to localStorage
    const pausedState: PausedTestState = {
      attemptId,
      testId: id!,
      type: type!,
      answers,
      markedForReview: Array.from(markedForReview),
      currentQuestionIndex,
      timeLeft,
    };
    localStorage.setItem(`paused_test_${attemptId}`, JSON.stringify(pausedState));
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    
    toast.success("Test paused! You can resume later from Mock Tests.");
    navigate("/mock-test");
  };

  const handleResumeTest = () => {
    setIsPaused(false);
    // Re-enter fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleSubmitClick = () => {
    setSubmitDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !attemptId) return;

    setSubmitDialogOpen(false);
    try {
      // Calculate score
      let correctCount = 0;
      let incorrectCount = 0;

      const userAnswers = questions.map((q) => {
        const selectedAnswer = answers[q.id];
        const selectedUpper = selectedAnswer ? selectedAnswer.toUpperCase() : null;
        const isCorrect = selectedUpper != null && selectedUpper === q.correct_answer;
        if (isCorrect) correctCount++;
        else if (selectedUpper) incorrectCount++;

        return {
          attempt_id: attemptId,
          question_id: q.id,
          selected_answer: selectedUpper,
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

      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

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
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const notAnsweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Fixed Header with Timer and Navigation */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Grid3x3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Questions</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Question Palette</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {/* Status Legend */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-500"></div>
                      <span>Answered ({answeredCount - markedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted"></div>
                      <span>Not Answered ({notAnsweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-500"></div>
                      <span>Marked ({markedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-yellow-500"></div>
                      <span>Answered & Marked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary ring-2 ring-primary ring-offset-2"></div>
                      <span>Current</span>
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="grid grid-cols-5 gap-2 pt-4 border-t">
                    {questions.map((q, idx) => {
                      const status = getQuestionStatus(q.id);
                      const isCurrent = idx === currentQuestionIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setPaletteOpen(false);
                          }}
                          className={`w-full aspect-square rounded text-sm font-bold transition-all ${getStatusColor(
                            status,
                            isCurrent
                          )}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <Button onClick={handleSubmitClick} className="w-full mt-4" size="lg" variant="destructive">
                    Submit Test
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex-1 min-w-0 text-center">
              <h2 className="font-semibold text-sm truncate">{testName}</h2>
              <p className="text-xs text-muted-foreground">
                Q {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseClick}
                className="shrink-0"
              >
                <Pause className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Pause</span>
              </Button>
              <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 rounded-lg">
                <Clock className="w-4 h-4 text-destructive" />
                <span className="text-sm font-bold text-destructive tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Question Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-base sm:text-lg break-words">
                Q{currentQuestionIndex + 1}. {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {["a", "b", "c", "d"].map((option) => (
                  <div
                    key={option}
                    className={`flex items-start space-x-3 p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      answers[currentQuestion.id] === option
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${option}`} className="mt-1" />
                    <Label
                      htmlFor={`option-${option}`}
                      className="flex-1 cursor-pointer font-medium break-words"
                    >
                      <span className="font-bold mr-2">{option.toUpperCase()}.</span>
                      {currentQuestion[`option_${option}` as keyof Question]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMarkForReview}
              className={`text-xs sm:text-sm ${markedForReview.has(currentQuestion.id) ? "bg-purple-500 text-white hover:bg-purple-600 hover:text-white" : ""}`}
            >
              {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => {
                const newAnswers = { ...answers };
                delete newAnswers[currentQuestion.id];
                setAnswers(newAnswers);
              }}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmitClick} variant="default" size="sm" className="text-xs sm:text-sm">
                Submit
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                variant="default"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved. You can resume this test later from the Mock Tests page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Answered</p>
              <p className="text-lg font-bold text-green-600">{answeredCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Time Left</p>
              <p className="text-lg font-bold">{formatTime(timeLeft)}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseTest}>Pause & Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit the test? You won't be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Total Questions</p>
              <p className="text-lg font-bold">{questions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Answered</p>
              <p className="text-lg font-bold text-green-600">{answeredCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Not Answered</p>
              <p className="text-lg font-bold text-destructive">{notAnsweredCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-muted-foreground">Time Left</p>
              <p className="text-lg font-bold">{formatTime(timeLeft)}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestTaking;