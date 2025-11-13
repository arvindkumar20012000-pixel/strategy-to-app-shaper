import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ExamCategory {
  id: string;
  name: string;
}

interface PreviousPaper {
  id: string;
  exam_type: string;
  paper_name: string;
  year: number;
  questions_count: number;
  pdf_url?: string;
  image_path?: string;
}

export const PreviousYearQuestions = () => {
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [papers, setPapers] = useState<PreviousPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPapers, setFetchingPapers] = useState(true);

  // Manual entry form state
  const [examType, setExamType] = useState("");
  const [paperName, setPaperName] = useState("");
  const [year, setYear] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // CSV and PDF upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvExamType, setCsvExamType] = useState("");
  const [csvPaperName, setCsvPaperName] = useState("");
  const [csvYear, setCsvYear] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchPapers();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("exam_categories")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Failed to fetch exam categories");
      return;
    }

    setCategories(data || []);
  };

  const fetchPapers = async () => {
    setFetchingPapers(true);
    const { data, error } = await supabase
      .from("previous_papers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      toast.error("Failed to fetch papers");
    } else {
      setPapers(data || []);
    }
    setFetchingPapers(false);
  };

  const uploadImageToStorage = async (file: File, paperId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${paperId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('previous-papers-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      return null;
    }

    return filePath;
  };

  const uploadPdfToStorage = async (file: File, paperId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${paperId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('previous-papers-pdf')
      .upload(filePath, file);

    if (uploadError) {
      console.error("PDF upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('previous-papers-pdf')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleManualSubmit = async () => {
    if (!examType || !paperName || !year || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Create or get paper
      const { data: existingPaper } = await supabase
        .from("previous_papers")
        .select("id")
        .eq("exam_type", examType)
        .eq("paper_name", paperName)
        .eq("year", parseInt(year))
        .single();

      let paperId = existingPaper?.id;

      if (!paperId) {
        const { data: newPaper, error: paperError } = await supabase
          .from("previous_papers")
          .insert({
            exam_type: examType,
            paper_name: paperName,
            year: parseInt(year),
            questions_count: 1,
            duration_minutes: 120,
          })
          .select()
          .single();

        if (paperError) throw paperError;
        paperId = newPaper.id;
      } else {
        // Update question count
        await supabase.rpc('increment_question_count' as any, { paper_id: paperId });
      }

      // Upload image if provided
      let imagePath = null;
      if (imageFile) {
        imagePath = await uploadImageToStorage(imageFile, paperId);
      }

      // Create question
      const { error: questionError } = await supabase
        .from("questions")
        .insert({
          paper_id: paperId,
          question_text: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
          explanation: explanation,
        });

      if (questionError) throw questionError;

      // Update paper with image path if uploaded
      if (imagePath) {
        await supabase
          .from("previous_papers")
          .update({ image_path: imagePath } as any)
          .eq("id", paperId);
      }

      toast.success("Question added successfully");
      
      // Reset form
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      setExplanation("");
      setImageFile(null);
      
      fetchPapers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !csvExamType || !csvPaperName || !csvYear) {
      toast.error("Please fill all fields and select a CSV file");
      return;
    }

    setLoading(true);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());

      // Create paper
      const { data: newPaper, error: paperError } = await supabase
        .from("previous_papers")
        .insert({
          exam_type: csvExamType,
          paper_name: csvPaperName,
          year: parseInt(csvYear),
          questions_count: lines.length - 1,
          duration_minutes: 120,
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Upload PDF if provided
      if (pdfFile) {
        const pdfUrl = await uploadPdfToStorage(pdfFile, newPaper.id);
        if (pdfUrl) {
          await supabase
            .from("previous_papers")
            .update({ pdf_url: pdfUrl })
            .eq("id", newPaper.id);
        }
      }

      // Parse and insert questions
      const questions = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        questions.push({
          paper_id: newPaper.id,
          question_text: values[0] || "",
          option_a: values[1] || "",
          option_b: values[2] || "",
          option_c: values[3] || "",
          option_d: values[4] || "",
          correct_answer: values[5] || "",
          explanation: values[6] || "",
        });
      }

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questions);

      if (questionsError) throw questionsError;

      toast.success(`Successfully uploaded ${questions.length} questions`);
      
      // Reset form
      setCsvFile(null);
      setPdfFile(null);
      setCsvExamType("");
      setCsvPaperName("");
      setCsvYear("");
      
      fetchPapers();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Are you sure you want to delete this paper and all its questions?")) return;

    const { error } = await supabase
      .from("previous_papers")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete paper");
    } else {
      toast.success("Paper deleted successfully");
      fetchPapers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Question Manually</CardTitle>
          <CardDescription>Enter question details one by one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paper Name</Label>
              <Input
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                placeholder="e.g., SSC CGL 2023"
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2023"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Option A</Label>
              <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Option B</Label>
              <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Option C</Label>
              <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Option D</Label>
              <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Option A</SelectItem>
                  <SelectItem value="B">Option B</SelectItem>
                  <SelectItem value="C">Option C</SelectItem>
                  <SelectItem value="D">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Explanation</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the correct answer"
              rows={3}
            />
          </div>

          <Button onClick={handleManualSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* CSV Bulk Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload via CSV</CardTitle>
          <CardDescription>
            CSV Format: question_text, option_a, option_b, option_c, option_d, correct_answer, explanation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <Select value={csvExamType} onValueChange={setCsvExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paper Name</Label>
              <Input
                value={csvPaperName}
                onChange={(e) => setCsvPaperName(e.target.value)}
                placeholder="e.g., SSC CGL 2023"
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={csvYear}
                onChange={(e) => setCsvYear(e.target.value)}
                placeholder="2023"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>PDF File (Optional)</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <Button onClick={handleCsvUpload} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload CSV
          </Button>
        </CardContent>
      </Card>

      {/* Recent Papers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Papers</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingPapers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : papers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No papers uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {papers.map((paper) => (
                <div key={paper.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{paper.paper_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {paper.exam_type} • {paper.year} • {paper.questions_count} questions
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeletePaper(paper.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
