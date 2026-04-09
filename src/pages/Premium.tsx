import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Loader2, Copy, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Plan {
  name: string;
  price: string;
  amount: number;
  period: string;
  planType: string;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Monthly",
    price: "₹49",
    amount: 49,
    period: "per month",
    planType: "monthly",
    features: [
      "Unlimited Mock Tests",
      "Previous Year Papers",
      "Detailed Solutions",
      "Performance Analytics",
      "Doubt Clearance",
      "Ad-free Experience",
      "Live Test Access",
    ],
  },
  {
    name: "6 Months",
    price: "₹259",
    amount: 259,
    period: "for 6 months",
    planType: "6months",
    popular: true,
    features: [
      "All Monthly Features",
      "Save 28%",
      "Priority Support",
      "Exclusive Study Material",
      "Referral Bonus",
      "Early Access to New Tests",
    ],
  },
];

const UPI_ID = "7897781415-3@ybl";

export default function Premium() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchPaymentRequests();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();
      if (data && new Date(data.end_date) > new Date()) {
        setCurrentSubscription(data);
      }
    } catch {}
  };

  const fetchPaymentRequests = async () => {
    try {
      const { data } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user?.id!)
        .order("created_at", { ascending: false });
      setPaymentRequests(data || []);
    } catch {}
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const handleSubmitUTR = async () => {
    if (!user || !selectedPlan) return;
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      toast.error("Please enter a valid UTR number");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        plan_type: selectedPlan.planType,
        amount: selectedPlan.amount,
        utr_number: utrNumber.trim(),
      });
      if (error) throw error;
      toast.success("Payment submitted for verification! You'll be upgraded within 24 hours.");
      setUtrNumber("");
      setSelectedPlan(null);
      fetchPaymentRequests();
    } catch (error: any) {
      toast.error("Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default: return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const hasPendingRequest = paymentRequests.some(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-3 pt-16 pb-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Crown className="w-7 h-7 text-secondary" />
            <h1 className="text-2xl font-bold">Upgrade to Premium</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Unlock unlimited access to all features
          </p>
        </div>

        {currentSubscription && (
          <Card className="p-4 mb-6 max-w-md mx-auto bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-600">Active Premium</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentSubscription.plan_type} plan • Expires: {new Date(currentSubscription.end_date).toLocaleDateString()}
            </p>
          </Card>
        )}

        {/* Plan Selection */}
        {!selectedPlan ? (
          <div className="grid gap-4 max-w-lg mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-5 cursor-pointer transition-all hover:shadow-md ${
                  plan.popular ? "border-secondary shadow-sm" : ""
                }`}
                onClick={() => !currentSubscription && !hasPendingRequest && setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <Badge className="bg-secondary text-secondary-foreground mb-3">Most Popular</Badge>
                )}
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    <p className="text-muted-foreground text-sm">{plan.period}</p>
                  </div>
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={!!currentSubscription || hasPendingRequest}
                >
                  {currentSubscription ? "Already Premium" : hasPendingRequest ? "Verification Pending" : "Select Plan"}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          /* Payment Flow */
          <Card className="p-5 max-w-lg mx-auto">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-sm text-primary mb-4 hover:underline"
            >
              ← Back to plans
            </button>

            <h2 className="text-lg font-bold mb-1">Pay via UPI</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedPlan.name} Plan — <span className="font-semibold">{selectedPlan.price}</span> {selectedPlan.period}
            </p>

            {/* Step 1: UPI ID */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">STEP 1: Send payment to this UPI ID</p>
              <div className="flex items-center gap-2 bg-background rounded-md p-3 border">
                <span className="font-mono font-semibold text-sm flex-1 break-all">{UPI_ID}</span>
                <Button size="sm" variant="outline" onClick={copyUPI} className="shrink-0">
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Amount: <span className="font-bold">{selectedPlan.price}</span> — Pay using any UPI app (GPay, PhonePe, Paytm, etc.)
              </p>
            </div>

            {/* Step 2: UTR */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">STEP 2: Enter your UTR/Transaction Reference Number</p>
              <Label htmlFor="utr" className="text-sm mb-1.5 block">UTR Number</Label>
              <Input
                id="utr"
                placeholder="Enter 12-digit UTR number"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                You can find the UTR number in your UPI app's transaction history
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmitUTR}
              disabled={submitting || !utrNumber.trim()}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </Card>
        )}

        {/* Payment History */}
        {paymentRequests.length > 0 && (
          <div className="max-w-lg mx-auto mt-6">
            <h3 className="font-semibold text-sm mb-3">Payment History</h3>
            <div className="space-y-2">
              {paymentRequests.map((req) => (
                <Card key={req.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(req.status)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {req.plan_type} — ₹{req.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          UTR: {req.utr_number} • {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  {req.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      Admin: {req.admin_notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
