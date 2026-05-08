import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TestHeader } from "@/components/test/TestHeader";
import { QuestionDisplay } from "@/components/test/QuestionDisplay";
import { QuestionPalette } from "@/components/test/QuestionPalette";
import { TestActionBar } from "@/components/test/TestActionBar";
import { TestDialogs } from "@/components/test/TestDialogs";

export interface Question {
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
  const type = searchParams.get("type");
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
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());

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

  // Enter fullscreen on mount (desktop only - avoid on mobile to prevent camera notch issues)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const enterFullscreen = async () => {
      try {
        if (!isMobile && document.documentElement.requestFullscreen) {
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

  // Mark first question as visited
  useEffect(() => {
    if (questions.length > 0) {
      setVisitedQuestions(prev => new Set(prev).add(questions[0].id));
    }
  }, [questions]);

  // Track visited questions
  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]) {
      setVisitedQuestions(prev => new Set(prev).add(questions[currentQuestionIndex].id));
    }
  }, [currentQuestionIndex, questions]);

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
      const savedState = localStorage.getItem(`paused_test_${resumeAttemptId}`);
      if (!savedState) {
        toast.error("Could not find saved test state");
        navigate("/mock-test");
        return;
      }
      const pausedState: PausedTestState = JSON.parse(savedState);
      const table = type === "paper" ? "previous_papers" : "mock_tests";
      const { data: testData, error: testError } = await supabase
        .from(table).select("*").eq("id", id).single();
      if (testError) throw testError;
      const name = type === "paper" ? (testData as any).paper_name : (testData as any).title;
      setTestName(name);
      setTotalTime(testData.duration_minutes * 60);
      const column = type === "paper" ? "paper_id" : "test_id";
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions").select("*").eq(column, id);
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
      setAttemptId(pausedState.attemptId);
      setAnswers(pausedState.answers);
      setMarkedForReview(new Set(pausedState.markedForReview));
      setCurrentQuestionIndex(pausedState.currentQuestionIndex);
      setTimeLeft(pausedState.timeLeft);
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
      const table = type === "paper" ? "previous_papers" : "mock_tests";
      const { data: testData, error: testError } = await supabase
        .from(table).select("*").eq("id", id).single();
      if (testError) throw testError;
      const name = type === "paper" ? (testData as any).paper_name : (testData as any).title;
      setTestName(name);
      setTotalTime(testData.duration_minutes * 60);
      setTimeLeft(testData.duration_minutes * 60);
      const column = type === "paper" ? "paper_id" : "test_id";
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions").select("*").eq(column, id);
      if (questionsError) throw questionsError;
      if (!questionsData || questionsData.length === 0) {
        toast.error("No questions available for this test");
        navigate(-1);
        return;
      }
      setQuestions(questionsData);
      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .insert({
          user_id: user.id,
          [type === "paper" ? "paper_id" : "test_id"]: id,
          total_questions: questionsData.length,
          score: 0, correct_answers: 0, incorrect_answers: 0,
        })
        .select().single();
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

  const clearResponse = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
  };

  const saveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const markForReviewAndNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const newMarked = new Set(markedForReview);
    newMarked.add(currentQuestion.id);
    setMarkedForReview(newMarked);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const getQuestionStatus = (questionId: string) => {
    const isAnswered = !!answers[questionId];
    const isMarked = markedForReview.has(questionId);
    const isVisited = visitedQuestions.has(questionId);
    if (isAnswered && isMarked) return "answered-marked";
    if (isAnswered) return "answered";
    if (isMarked) return "marked";
    if (isVisited) return "not-answered";
    return "not-visited";
  };

  const handlePauseTest = () => {
    setIsPaused(true);
    setPauseDialogOpen(false);
    const pausedState: PausedTestState = {
      attemptId, testId: id!, type: type!,
      answers, markedForReview: Array.from(markedForReview),
      currentQuestionIndex, timeLeft,
    };
    localStorage.setItem(`paused_test_${attemptId}`, JSON.stringify(pausedState));
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    toast.success("Test paused! You can resume later from Mock Tests.");
    navigate("/mock-test");
  };

  const handleSubmit = async () => {
    if (!user || !attemptId) return;
    setSubmitDialogOpen(false);
    try {
      let correctCount = 0;
      let incorrectCount = 0;
      const userAnswers = questions.map((q) => {
        const selectedAnswer = answers[q.id];
        const selectedUpper = selectedAnswer ? selectedAnswer.toUpperCase() : null;
        const isCorrect = selectedUpper != null && selectedUpper === q.correct_answer;
        if (isCorrect) correctCount++;
        else if (selectedUpper) incorrectCount++;
        return {
          attempt_id: attemptId, question_id: q.id,
          selected_answer: selectedUpper, is_correct: isCorrect,
        };
      });
      const { error: answersError } = await supabase.from("user_answers").insert(userAnswers);
      if (answersError) throw answersError;
      const score = Math.round((correctCount / questions.length) * 100);
      const timeTaken = Math.floor((totalTime - timeLeft) / 60);
      const { error: updateError } = await supabase
        .from("test_attempts")
        .update({
          score, correct_answers: correctCount, incorrect_answers: incorrectCount,
          time_taken_minutes: timeTaken, completed_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
      if (updateError) throw updateError;
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      toast.success("Test submitted successfully!");
      navigate(`/test-result/${attemptId}`);
    } catch (error: any) {
      toast.error("Failed to submit test");
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(210,20%,96%)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading Examination...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const notAnsweredCount = questions.filter(q => visitedQuestions.has(q.id) && !answers[q.id]).length;
  const notVisitedCount = questions.filter(q => !visitedQuestions.has(q.id)).length;
  const answeredMarkedCount = questions.filter(q => answers[q.id] && markedForReview.has(q.id)).length;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden select-none" style={{ background: 'hsl(210, 20%, 96%)', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Top Header Bar - Exam Title */}
      <TestHeader
        testName={testName}
        timeLeft={timeLeft}
        formatTime={formatTime}
        onPause={() => setPauseDialogOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        totalTime={totalTime}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area - Left/Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question Number Bar */}
          <div className="px-3 py-2 border-b" style={{ background: 'hsl(210, 25%, 92%)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'hsl(235, 69%, 31%)' }}>
                Question No. {currentQuestionIndex + 1}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded font-medium" style={{ background: 'hsl(235, 69%, 31%)', color: 'white' }}>
                  Single Choice
                </span>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="sm:hidden px-2 py-1 rounded text-xs font-medium border"
                  style={{ borderColor: 'hsl(235, 69%, 31%)', color: 'hsl(235, 69%, 31%)' }}
                >
                  {currentQuestionIndex + 1}/{questions.length}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Question Content */}
          <div className="flex-1 overflow-y-auto">
            <QuestionDisplay
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              selectedAnswer={answers[currentQuestion.id] || ""}
              onAnswerSelect={handleAnswerSelect}
              isMarked={markedForReview.has(currentQuestion.id)}
            />
          </div>

          {/* Bottom Action Bar */}
          <TestActionBar
            onMarkAndNext={markForReviewAndNext}
            onClearResponse={clearResponse}
            onSaveAndNext={saveAndNext}
            onPrevious={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            onSubmit={() => setSubmitDialogOpen(true)}
            isFirstQuestion={currentQuestionIndex === 0}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            isMarked={markedForReview.has(currentQuestion.id)}
            onToggleMark={toggleMarkForReview}
          />
        </div>

        {/* Right Sidebar - Question Palette (Desktop) */}
        <div className="hidden sm:block w-[260px] border-l overflow-y-auto" style={{ background: 'hsl(0, 0%, 100%)' }}>
          <QuestionPalette
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            markedForReview={markedForReview}
            visitedQuestions={visitedQuestions}
            getQuestionStatus={getQuestionStatus}
            onQuestionSelect={(idx) => setCurrentQuestionIndex(idx)}
            answeredCount={answeredCount}
            notAnsweredCount={notAnsweredCount}
            markedCount={markedCount}
            notVisitedCount={notVisitedCount}
            answeredMarkedCount={answeredMarkedCount}
            onSubmit={() => setSubmitDialogOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Palette Sheet */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPaletteOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white overflow-y-auto shadow-2xl">
            <div className="p-3 border-b flex items-center justify-between" style={{ background: 'hsl(235, 69%, 31%)', color: 'white' }}>
              <span className="font-semibold text-sm">Question Palette</span>
              <button onClick={() => setPaletteOpen(false)} className="text-white/80 hover:text-white text-lg">✕</button>
            </div>
            <QuestionPalette
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              markedForReview={markedForReview}
              visitedQuestions={visitedQuestions}
              getQuestionStatus={getQuestionStatus}
              onQuestionSelect={(idx) => { setCurrentQuestionIndex(idx); setPaletteOpen(false); }}
              answeredCount={answeredCount}
              notAnsweredCount={notAnsweredCount}
              markedCount={markedCount}
              notVisitedCount={notVisitedCount}
              answeredMarkedCount={answeredMarkedCount}
              onSubmit={() => { setPaletteOpen(false); setSubmitDialogOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <TestDialogs
        pauseDialogOpen={pauseDialogOpen}
        setPauseDialogOpen={setPauseDialogOpen}
        submitDialogOpen={submitDialogOpen}
        setSubmitDialogOpen={setSubmitDialogOpen}
        onPause={handlePauseTest}
        onSubmit={handleSubmit}
        answeredCount={answeredCount}
        notAnsweredCount={notAnsweredCount + notVisitedCount}
        markedCount={markedCount}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        formatTime={formatTime}
      />
    </div>
  );
};

export default TestTaking;
