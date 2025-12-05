import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import iconNcert from "@/assets/icon-ncert.png";

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_name: string;
  pages: number | null;
  pdf_url: string | null;
}

const SUBJECTS = [
  "Mathematics",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Political Science",
  "Economics",
];

const NCERT = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentChapterName, setCurrentChapterName] = useState("");
  const { user } = useAuth();

  const classes = ["6", "7", "8", "9", "10", "11", "12"];

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchChapters();
    }
  }, [selectedClass, selectedSubject]);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ncert_content")
        .select("*")
        .eq("class_number", parseInt(selectedClass))
        .eq("subject", selectedSubject)
        .order("chapter_number");

      if (error) throw error;
      setChapters(data || []);
    } catch (error: any) {
      toast.error("Failed to load chapters");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = (chapter: Chapter) => {
    if (!chapter.pdf_url) {
      toast.error("PDF not available for this chapter");
      return;
    }
    setCurrentPdfUrl(chapter.pdf_url);
    setCurrentChapterName(`Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`);
    setPdfViewerOpen(true);
  };

  const handleDownload = async (chapter: Chapter) => {
    if (!user) {
      toast.error("Please login to download");
      return;
    }

    if (!chapter.pdf_url) {
      toast.error("PDF not available for this chapter");
      return;
    }

    try {
      // Track download
      await supabase.from("downloads").insert({
        user_id: user.id,
        content_type: "ncert",
        content_id: chapter.id,
        file_name: chapter.chapter_name,
      });

      // Create a download link
      const link = document.createElement("a");
      link.href = chapter.pdf_url;
      link.target = "_blank";
      link.download = `Class_${selectedClass}_${selectedSubject}_Chapter_${chapter.chapter_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to download");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-4 py-6 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={iconNcert} alt="NCERT" className="w-12 h-12" />
            <h1 className="text-2xl font-bold">NCERT Solutions</h1>
          </div>
          <p className="text-muted-foreground">
            Access comprehensive NCERT solutions for all classes and subjects
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  Class {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedClass && (
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chapters...</p>
          </div>
        ) : selectedClass && selectedSubject ? (
          chapters.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Chapters</h2>
              {chapters.map((chapter) => (
                <Card key={chapter.id} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg break-words">
                      Chapter {chapter.chapter_number}: {chapter.chapter_name}
                    </CardTitle>
                    {chapter.pages && (
                      <p className="text-sm text-muted-foreground">{chapter.pages} pages</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleViewPdf(chapter)}
                      disabled={!chapter.pdf_url}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {chapter.pdf_url ? "View PDF" : "PDF Not Available"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(chapter)}
                      disabled={!chapter.pdf_url}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <img src={iconNcert} alt="NCERT" className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Chapters Available</h3>
                <p className="text-muted-foreground">
                  Content for this class and subject is being added
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <img src={iconNcert} alt="NCERT" className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select Class and Subject</h3>
              <p className="text-muted-foreground">
                Choose your class and subject to access NCERT solutions
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 w-[calc(100vw-1rem)]">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4">{currentChapterName}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPdfViewerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 h-full p-4 pt-2">
            <iframe
              src={`${currentPdfUrl}#toolbar=1`}
              className="w-full h-full rounded-lg border"
              title="PDF Viewer"
            />
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default NCERT;