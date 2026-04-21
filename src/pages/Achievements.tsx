import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import * as Icons from "lucide-react";
import { Lock } from "lucide-react";

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
}

const Achievements = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: catalog }, { data: mine }] = await Promise.all([
      supabase.from("achievements").select("*").order("display_order"),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
    ]);
    setAchievements((catalog as Achievement[]) || []);
    setEarned(new Set((mine || []).map((m: any) => m.achievement_id)));
    setLoading(false);
  };

  const renderIcon = (name: string, locked: boolean) => {
    const Icon = (Icons as any)[name] || Icons.Award;
    return <Icon className={`w-8 h-8 ${locked ? "text-muted-foreground" : "text-primary"}`} />;
  };

  const earnedCount = achievements.filter((a) => earned.has(a.id)).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-3 pt-16 pb-4 space-y-4">
        <div className="pt-2 text-center">
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {earnedCount} / {achievements.length} unlocked
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((a) => {
              const isEarned = earned.has(a.id);
              return (
                <Card
                  key={a.id}
                  className={`relative ${isEarned ? "border-primary" : "opacity-60"}`}
                >
                  <CardContent className="pt-5 pb-4 text-center">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                        isEarned ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {isEarned ? (
                        renderIcon(a.icon, false)
                      ) : (
                        <Lock className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Achievements;
