import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye } from "lucide-react";
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

const NCERT = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const classes = ["6", "7", "8", "9", "10", "11", "12"];
  const subjects = ["Mathematics", "Science", "Social Science", "English", "Hindi", "Physics", "Chemistry", "Biology"];

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

  const handleDownload = async (chapterId: string, chapterName: string) => {
    if (!user) return;

    try {
      await supabase.from("downloads").insert({
        user_id: user.id,
        content_type: "ncert",
        content_id: chapterId,
        file_name: chapterName,
      });

      toast.success("Download tracked! PDF feature coming soon");
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-4 py-6">
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
                {subjects.map((subject) => (
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
                <Card key={chapter.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Chapter {chapter.chapter_number}: {chapter.chapter_name}
                    </CardTitle>
                    {chapter.pages && (
                      <p className="text-sm text-muted-foreground">{chapter.pages} pages</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button className="flex-1" disabled>
                      <Eye className="w-4 h-4" />
                      View PDF (Coming Soon)
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(chapter.id, chapter.chapter_name)}
                    >
                      <Download className="w-4 h-4" />
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

      <BottomNav />
    </div>
  );
};

export default NCERT;
