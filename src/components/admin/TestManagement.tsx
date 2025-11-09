import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileQuestion, Plus, Loader2, Trash2 } from "lucide-react";

interface MockTest {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  questions_count: number;
}

interface ExamCategory {
  id: string;
  name: string;
}

export function TestManagement() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionsCount, setQuestionsCount] = useState("20");
  const [examType, setExamType] = useState("");
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    fetchTests();
    fetchExamCategories();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast.error("Failed to load tests");
    } finally {
      setFetching(false);
    }
  };

  const fetchExamCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setExamCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load exam categories:", error);
    }
  };

  const handleGenerateTest = async () => {
    if (!subject || !examType) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          subject,
          difficulty,
          questionsCount: parseInt(questionsCount),
          examType,
          language,
        },
      });

      if (error) throw error;

      toast.success("Test generated successfully");
      setSubject("");
      await fetchTests();
    } catch (error: any) {
      toast.error("Failed to generate test: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      const { error } = await supabase.from("mock_tests").delete().eq("id", id);
      if (error) throw error;

      toast.success("Test deleted");
      await fetchTests();
    } catch (error: any) {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileQuestion className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Generate AI Mock Test</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="exam-type">Exam Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger id="exam-type">
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {examCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., General Knowledge, Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="questions">Number of Questions</Label>
            <Select value={questionsCount} onValueChange={setQuestionsCount}>
              <SelectTrigger id="questions">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="test-language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="test-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerateTest} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Generate Test
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Tests</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{test.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {test.subject} • {test.difficulty} • {test.questions_count} questions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTest(test.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
