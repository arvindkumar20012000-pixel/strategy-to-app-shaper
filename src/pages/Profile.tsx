import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Wallet,
  Crown,
  History,
  Award,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface WalletData {
  balance: number;
}

interface Subscription {
  plan_type: string;
  status: string;
  end_date: string;
}

interface TestAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  test_id: string | null;
  paper_id: string | null;
}

const Profile = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Fetch subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setSubscription(subData);

      // Fetch test attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData || []);

      // Calculate stats
      if (attemptsData && attemptsData.length > 0) {
        const avgScore =
          attemptsData.reduce((sum, att) => sum + att.score, 0) /
          attemptsData.length;
        const bestScore = Math.max(...attemptsData.map((att) => att.score));

        setStats({
          totalTests: attemptsData.length,
          avgScore: Math.round(avgScore),
          bestScore,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {profile?.full_name || "User"}
                </h1>
                <p className="text-muted-foreground mb-2">{profile?.email}</p>
                {subscription && (
                  <Badge className="bg-secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    {subscription.plan_type.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Wallet</p>
              <p className="text-2xl font-bold">₹{wallet?.balance || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <History className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <p className="text-sm text-muted-foreground">Tests Taken</p>
              <p className="text-2xl font-bold">{stats.totalTests}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-sm text-muted-foreground">Best Score</p>
              <p className="text-2xl font-bold">{stats.bestScore}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length > 0 ? (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/test-result/${attempt.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {attempt.test_id ? "Mock Test" : "Previous Paper"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{attempt.score}%</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.total_questions} questions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No test attempts yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/mock-test")}
                >
                  Take Your First Test
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
