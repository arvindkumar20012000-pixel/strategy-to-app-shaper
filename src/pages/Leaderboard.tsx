import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award } from "lucide-react";

interface Row {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_score: number;
  tests_taken: number;
  rank: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "all">("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [period]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_leaderboard", { _period: period });
    if (error) console.error(error);
    setRows(((data as unknown) as Row[]) || []);
    setLoading(false);
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-semibold w-5 text-center">{rank}</span>;
  };

  const myRow = rows.find((r) => r.user_id === user?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-3xl mx-auto px-3 pt-16 pb-4 space-y-4">
        <div className="text-center pt-2">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">Top performers ranked by total score</p>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {myRow && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-8 flex justify-center">{rankIcon(myRow.rank)}</div>
              <Avatar className="w-9 h-9">
                <AvatarFallback>{myRow.full_name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">You</p>
                <p className="text-xs text-muted-foreground">{myRow.tests_taken} tests</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{myRow.total_score}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0 divide-y">
            {loading ? (
              <p className="p-6 text-center text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                No scores yet for this period
              </p>
            ) : (
              rows.map((r) => (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 p-3 ${
                    r.user_id === user?.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-8 flex justify-center">{rankIcon(r.rank)}</div>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback>{r.full_name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.tests_taken} tests</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{r.total_score}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
