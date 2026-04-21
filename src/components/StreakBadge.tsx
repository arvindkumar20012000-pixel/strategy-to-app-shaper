import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export const StreakBadge = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrent(data.current_streak);
          setLongest(data.longest_streak);
        }
      });
  }, [user]);

  return (
    <Card className="bg-gradient-to-br from-warning/10 to-destructive/10 border-warning/30">
      <CardContent className="pt-4 pb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center">
          <Flame className="w-7 h-7 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-3xl font-bold">{current}</p>
          <p className="text-xs text-muted-foreground">
            day streak • Best: {longest}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
