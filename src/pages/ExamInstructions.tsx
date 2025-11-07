import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, BookOpen, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ExamInstructions = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const testId = searchParams.get("testId");
  const paperId = searchParams.get("paperId");
  const type = searchParams.get("type") || "test";
  const examName = searchParams.get("name") || "Mock Test";

  const handleStartExam = () => {
    if (!agreed) return;
    
    if (paperId) {
      navigate(`/test-taking/${paperId}?type=paper`);
    } else if (testId) {
      navigate(`/test-taking/${testId}?type=test`);
    }
  };

  const instructions = [
    "The exam duration is fixed. Once the timer ends, the exam will be automatically submitted.",
    "You can navigate between questions using the navigation buttons or question numbers.",
    "Each question has four options (A, B, C, D). Select the most appropriate answer.",
    "You can review and change your answers before submitting the exam.",
    "Once you submit the exam, you cannot make any changes.",
    "Make sure you have a stable internet connection throughout the exam.",
    "Do not refresh or close the browser window during the exam.",
    "Your progress is automatically saved as you answer questions.",
  ];

  const guidelines = [
    "Read each question carefully before selecting an answer",
    "Manage your time wisely across all questions",
    "Review all answers before final submission",
    "Stay focused and avoid distractions",
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Exam Header */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{examName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Online Examination Portal
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Important Notice */}
        <Alert className="mb-6 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-200">
            Please read all instructions carefully before starting the examination. 
            Once you begin, the timer will start automatically.
          </AlertDescription>
        </Alert>

        {/* Instructions Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>Examination Instructions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground pt-0.5">{instruction}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <CardTitle>Important Guidelines</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {guidelines.map((guideline, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{guideline}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Check */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle>System Requirements</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Stable internet connection - Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Modern web browser (Chrome, Firefox, Safari, Edge)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>JavaScript enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Declaration */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="cursor-pointer font-medium">
                  I have read and understood all the instructions
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  By checking this box, I confirm that I am ready to begin the examination 
                  and will follow all guidelines mentioned above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={handleStartExam}
            disabled={!agreed}
            className="flex-1"
            size="lg"
          >
            Start Examination
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ExamInstructions;
