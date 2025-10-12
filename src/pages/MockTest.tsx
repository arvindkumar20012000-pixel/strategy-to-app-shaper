import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Clock, Target } from "lucide-react";

const MockTest = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjects = [
    "History",
    "Geography",
    "Civics",
    "Economics",
    "Mathematics",
    "Hindi",
    "English",
    "Sanskrit",
    "CDP",
  ];

  const mockTests = [
    {
      id: 1,
      title: "General Knowledge Test",
      subject: "History",
      questions: 20,
      duration: 30,
      difficulty: "Medium",
    },
    {
      id: 2,
      title: "Ancient India Quiz",
      subject: "History",
      questions: 20,
      duration: 30,
      difficulty: "Easy",
    },
    {
      id: 3,
      title: "Modern History Assessment",
      subject: "History",
      questions: 20,
      duration: 30,
      difficulty: "Hard",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-success";
      case "Medium":
        return "text-secondary";
      case "Hard":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-2xl font-bold">AI Mock Tests</h1>
          </div>
          <p className="text-muted-foreground">
            AI-generated tests tailored to your preparation needs
          </p>
        </div>

        <div className="mb-6">
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
        </div>

        {selectedSubject ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available Tests</h2>
              <Button variant="secondary">
                <Brain className="w-4 h-4" />
                Generate New Test
              </Button>
            </div>

            {mockTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {test.questions} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.duration} mins
                    </span>
                    <span className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Test</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-24 h-24 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a Subject</h3>
              <p className="text-muted-foreground">
                Choose a subject to view available AI-generated mock tests
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MockTest;
