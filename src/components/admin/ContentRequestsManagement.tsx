import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, MessageSquare, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ContentRequest {
  id: string;
  user_id: string;
  content_type: string;
  details: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

export function ContentRequestsManagement() {
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; request: ContentRequest | null }>({
    open: false,
    request: null,
  });
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("content_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("Failed to load requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponse = (request: ContentRequest) => {
    setResponseDialog({ open: true, request });
    setAdminResponse(request.admin_response || "");
    setNewStatus(request.status);
  };

  const handleUpdateRequest = async () => {
    if (!responseDialog.request) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("content_requests")
        .update({
          status: newStatus,
          admin_response: adminResponse || null,
        })
        .eq("id", responseDialog.request.id);

      if (error) throw error;

      toast.success("Request updated successfully");
      setResponseDialog({ open: false, request: null });
      fetchRequests();
    } catch (error: any) {
      toast.error("Failed to update request");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const { error } = await supabase
        .from("content_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Request deleted");
      fetchRequests();
    } catch (error: any) {
      toast.error("Failed to delete request");
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Content Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No content requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">{request.content_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{request.details}</p>
                    {request.admin_response && (
                      <div className="p-3 bg-muted rounded-lg mb-3">
                        <p className="text-sm font-medium mb-1">Your Response:</p>
                        <p className="text-sm">{request.admin_response}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      <Button size="sm" onClick={() => handleOpenResponse(request)}>
                        Respond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={responseDialog.open} onOpenChange={(open) => setResponseDialog({ open, request: open ? responseDialog.request : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Request</DialogTitle>
          </DialogHeader>
          
          {responseDialog.request && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Content Type</p>
                <p className="text-sm text-muted-foreground">{responseDialog.request.content_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Request Details</p>
                <p className="text-sm text-muted-foreground">{responseDialog.request.details}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Admin Response</p>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write your response to the user..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequest} disabled={updating}>
              {updating ? "Updating..." : "Update Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}