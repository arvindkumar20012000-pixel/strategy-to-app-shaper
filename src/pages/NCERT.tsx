import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye } from "lucide-react";
import iconNcert from "@/assets/icon-ncert.png";

const NCERT = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const classes = ["6", "7", "8", "9", "10", "11", "12"];
  const subjects = ["Mathematics", "Science", "Social Science", "English", "Hindi"];
  const chapters = [
    { id: 1, name: "Chapter 1: Introduction", pages: 25 },
    { id: 2, name: "Chapter 2: Basic Concepts", pages: 32 },
    { id: 3, name: "Chapter 3: Advanced Topics", pages: 45 },
  ];

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

        {selectedClass && selectedSubject && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Chapters</h2>
            {chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{chapter.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{chapter.pages} pages</p>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button className="flex-1">
                    <Eye className="w-4 h-4" />
                    View PDF
                  </Button>
                  <Button variant="secondary">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(!selectedClass || !selectedSubject) && (
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
