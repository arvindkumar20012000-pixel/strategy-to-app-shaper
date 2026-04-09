import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const PaymentVerification = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; request: any; action: "approve" | "reject" } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch user emails for each request
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      setRequests((data || []).map((r: any) => ({ ...r, profile: profileMap[r.user_id] })));
    } catch {
      toast.error("Failed to load payment requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { request, action } = actionDialog;
    setProcessing(true);

    try {
      // Update payment request status
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: adminNotes || null,
        })
        .eq("id", request.id);
      if (updateError) throw updateError;

      if (action === "approve") {
        // Calculate end date
        const endDate = new Date();
        if (request.plan_type === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 6);
        }

        // Create subscription
        const { error: subError } = await supabase.from("subscriptions").insert({
          user_id: request.user_id,
          plan_type: request.plan_type,
          amount: request.amount,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        });
        if (subError) throw subError;

        // Add premium role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: request.user_id,
          role: "premium" as any,
        });
        // Ignore duplicate role error
        if (roleError && !roleError.message.includes("duplicate")) throw roleError;

        toast.success("Payment approved! User upgraded to premium.");
      } else {
        toast.success("Payment request rejected.");
      }

      setActionDialog(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.utr_number?.toLowerCase().includes(q) ||
        r.profile?.email?.toLowerCase().includes(q) ||
        r.profile?.full_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Payment Verification</h2>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by UTR, email, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize text-xs"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No payment requests found
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {req.status === "pending" && <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
                    {req.status === "approved" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {req.status === "rejected" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <span className="font-medium text-sm truncate">
                      {req.profile?.full_name || req.profile?.email || "Unknown User"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.profile?.email}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                    <span>Plan: <strong>{req.plan_type}</strong></span>
                    <span>Amount: <strong>₹{req.amount}</strong></span>
                    <span>UTR: <strong className="font-mono">{req.utr_number}</strong></span>
                    <span>{new Date(req.created_at).toLocaleString()}</span>
                  </div>
                  {req.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      Note: {req.admin_notes}
                    </p>
                  )}
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => setActionDialog({ open: true, request: req, action: "approve" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                      onClick={() => setActionDialog({ open: true, request: req, action: "reject" })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "approve"
                ? "This will activate premium for the user."
                : "This will reject the payment request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm bg-muted/50 p-3 rounded">
              <p>UTR: <strong className="font-mono">{actionDialog?.request?.utr_number}</strong></p>
              <p>Amount: <strong>₹{actionDialog?.request?.amount}</strong></p>
              <p>Plan: <strong>{actionDialog?.request?.plan_type}</strong></p>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                placeholder="Add a note..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button
                className={`flex-1 ${actionDialog?.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
                onClick={handleAction}
                disabled={processing}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : actionDialog?.action === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
