import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Test {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  questions_count: number;
  duration_minutes: number;
}

export default function LiveTests() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string, testName: string) => {
    navigate(`/exam-instructions?testId=${testId}&name=${encodeURIComponent(testName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <Radio className="w-6 h-6 text-destructive" />
          <h1 className="text-2xl font-bold">Live Tests</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No tests available at the moment.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{test.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{test.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{test.difficulty}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration_minutes} minutes</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Radio className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{test.questions_count} Questions</span>
                  <Button onClick={() => handleStartTest(test.id, test.title)}>
                    Start Test
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
