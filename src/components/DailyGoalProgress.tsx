import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

export const DailyGoalProgress = () => {
  const { user } = useAuth();
  const [goal, setGoal] = useState(5);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("daily_goal")
        .eq("user_id", user.id)
        .maybeSingle();
      if (streak?.daily_goal) setGoal(streak.daily_goal);

      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("test_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", since.toISOString());
      setDone(count || 0);
    })();
  }, [user]);

  const pct = Math.min(100, Math.round((done / goal) * 100));

  return (
    <div className="bg-muted/50 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Daily Goal</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {done} / {goal} tests today
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
};
