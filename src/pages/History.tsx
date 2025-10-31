import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Attempt {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  time_taken_minutes: number;
  completed_at: string;
}

export default function History() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error: any) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <h1 className="text-2xl font-bold mb-6">Attempt History</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : attempts.length > 0 ? (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(attempt.completed_at), "MMM dd, yyyy • HH:mm")}
                    </span>
                  </div>
                  <Badge variant={attempt.score >= 60 ? "default" : "destructive"}>
                    {attempt.score}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-2xl font-bold text-green-500">
                        {attempt.correct_answers}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-2xl font-bold text-destructive">
                        {attempt.incorrect_answers}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-bold">{attempt.time_taken_minutes}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Minutes</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/test-result/${attempt.id}`)}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No test attempts yet</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
