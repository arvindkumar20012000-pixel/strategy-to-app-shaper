import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Clock, Target, BookOpen } from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    avgScore: 0,
    totalTests: 0,
    bestSubject: "—",
  });

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: attempts } = await supabase
        .from("test_attempts")
        .select("*, mock_tests(subject), previous_papers(exam_type)")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      const list = attempts || [];

      // Score over time (last 20)
      setScoreData(
        list.slice(-20).map((a: any, i: number) => ({
          name: new Date(a.completed_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          score: a.score,
        }))
      );

      // Subject-wise accuracy
      const bySubject: Record<string, { correct: number; total: number }> = {};
      list.forEach((a: any) => {
        const subj =
          a.mock_tests?.subject || a.previous_papers?.exam_type || "Other";
        if (!bySubject[subj]) bySubject[subj] = { correct: 0, total: 0 };
        bySubject[subj].correct += a.correct_answers;
        bySubject[subj].total += a.total_questions;
      });
      const subjArr = Object.entries(bySubject).map(([subject, v]) => ({
        subject,
        accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
      }));
      setSubjectData(subjArr);

      const totalMinutes = list.reduce(
        (s: number, a: any) => s + (a.time_taken_minutes || 0),
        0
      );
      const avgScore = list.length
        ? Math.round(list.reduce((s: number, a: any) => s + a.score, 0) / list.length)
        : 0;
      const bestSubject = subjArr.length
        ? subjArr.reduce((a, b) => (a.accuracy > b.accuracy ? a : b)).subject
        : "—";

      setStats({
        totalMinutes,
        avgScore,
        totalTests: list.length,
        bestSubject,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-3 pt-16 pb-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress over time
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{stats.totalTests}</p>
              <p className="text-xs text-muted-foreground">Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-success" />
              <p className="text-xl font-bold">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-1 text-secondary" />
              <p className="text-xl font-bold">{stats.totalMinutes}m</p>
              <p className="text-xs text-muted-foreground">Time Studied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-1 text-warning" />
              <p className="text-xs font-bold truncate">{stats.bestSubject}</p>
              <p className="text-xs text-muted-foreground">Best Subject</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading…
              </p>
            ) : scoreData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Take a test to see your progress
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {subjectData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-success">Strong Areas</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectData
                  .filter((s) => s.accuracy >= 70)
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s.subject} className="flex justify-between py-1">
                      <span className="text-sm">{s.subject}</span>
                      <span className="text-sm font-semibold">{s.accuracy}%</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Needs Work</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectData
                  .filter((s) => s.accuracy < 70)
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s.subject} className="flex justify-between py-1">
                      <span className="text-sm">{s.subject}</span>
                      <span className="text-sm font-semibold">{s.accuracy}%</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;
