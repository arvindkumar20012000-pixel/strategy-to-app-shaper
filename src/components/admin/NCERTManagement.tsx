import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Plus, Loader2, Trash2 } from "lucide-react";

interface NCERTContent {
  id: string;
  class_number: number;
  subject: string;
  chapter_number: number;
  chapter_name: string;
  pages: number | null;
  pdf_url: string | null;
}

export function NCERTManagement() {
  const [content, setContent] = useState<NCERTContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [classNumber, setClassNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [pages, setPages] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("ncert_content")
        .select("*")
        .order("class_number", { ascending: true })
        .order("chapter_number", { ascending: true })
        .limit(20);

      if (error) throw error;
      setContent(data || []);
    } catch (error: any) {
      toast.error("Failed to load NCERT content");
    } finally {
      setFetching(false);
    }
  };

  const handleAddContent = async () => {
    if (!classNumber || !subject || !chapterNumber || !chapterName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("ncert_content").insert({
        class_number: parseInt(classNumber),
        subject,
        chapter_number: parseInt(chapterNumber),
        chapter_name: chapterName,
        pages: pages ? parseInt(pages) : null,
        pdf_url: pdfUrl || null,
      });

      if (error) throw error;

      toast.success("NCERT content added successfully");
      setClassNumber("");
      setSubject("");
      setChapterNumber("");
      setChapterName("");
      setPages("");
      setPdfUrl("");
      await fetchContent();
    } catch (error: any) {
      toast.error("Failed to add content: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      const { error } = await supabase.from("ncert_content").delete().eq("id", id);
      if (error) throw error;

      toast.success("Content deleted");
      await fetchContent();
    } catch (error: any) {
      toast.error("Failed to delete content");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">NCERT Content Management</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              type="number"
              placeholder="e.g., 10"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="chapter-number">Chapter Number</Label>
            <Input
              id="chapter-number"
              type="number"
              placeholder="e.g., 1"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="chapter-name">Chapter Name</Label>
            <Input
              id="chapter-name"
              placeholder="Enter chapter name"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pages">Pages (optional)</Label>
            <Input
              id="pages"
              type="number"
              placeholder="e.g., 50"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pdf-url">PDF URL (optional)</Label>
            <Input
              id="pdf-url"
              placeholder="https://example.com/ncert.pdf"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAddContent} disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add NCERT Content
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Content</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {content.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">
                    Class {item.class_number} - {item.subject}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Chapter {item.chapter_number}: {item.chapter_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteContent(item.id)}
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
