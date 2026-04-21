import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Share2, Gift, Users, Wallet } from "lucide-react";

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  bonus_amount: number | null;
  created_at: string;
  referred_id: string | null;
}

const Referrals = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [code, setCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get existing referrals where I'm the referrer
      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      let myCode = refs?.[0]?.referral_code;

      // If no code yet, generate and seed a placeholder row
      if (!myCode) {
        const { data: codeData } = await supabase.rpc("generate_referral_code");
        myCode = codeData as string;
        await supabase.from("referrals").insert({
          referrer_id: user.id,
          referral_code: myCode,
          status: "pending",
        });
        const { data: refreshed } = await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false });
        setReferrals(refreshed || []);
      } else {
        setReferrals(refs || []);
      }
      setCode(myCode);

      const { data: w } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setWalletBalance(Number(w?.balance || 0));
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  const link = `${window.location.origin}/auth?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const shareLink = async () => {
    const shareData = {
      title: "Join StudyByte",
      text: `Join me on StudyByte and get exam prep at your fingertips. Use my code: ${code}`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      copyLink();
    }
  };

  const completed = referrals.filter((r) => r.status === "completed" && r.referred_id);
  const pending = referrals.filter((r) => r.status === "pending" && r.referred_id);
  const totalEarned = completed.reduce((s, r) => s + Number(r.bonus_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setDrawerOpen(true)} showSearch={false} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="max-w-3xl mx-auto px-3 pt-16 pb-4 space-y-4">
        <div className="rounded-2xl bg-gradient-primary text-white p-6 text-center">
          <Gift className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">Refer & Earn</h1>
          <p className="text-white/90 text-sm">
            Earn ₹10 for every friend who completes their first test
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Friends Joined</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Gift className="w-6 h-6 mx-auto mb-1 text-secondary" />
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Wallet className="w-6 h-6 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">₹{totalEarned}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="flex items-center justify-center bg-muted rounded-lg py-4">
                  <span className="text-2xl font-bold tracking-widest">{code}</span>
                </div>
                <Input value={link} readOnly className="text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Link
                  </Button>
                  <Button onClick={shareLink}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Wallet balance: ₹{walletBalance}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.filter((r) => r.referred_id).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No referrals yet. Share your code to start earning!
              </p>
            ) : (
              <div className="space-y-2">
                {referrals
                  .filter((r) => r.referred_id)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-medium">Friend joined</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={r.status === "completed" ? "default" : "secondary"}
                      >
                        {r.status === "completed"
                          ? `+₹${r.bonus_amount}`
                          : "Pending"}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>1. Share your unique referral link with friends</p>
            <p>2. They sign up using your link</p>
            <p>3. When they complete their first test, you earn ₹10</p>
            <p>4. Bonus is credited instantly to your wallet</p>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Referrals;
