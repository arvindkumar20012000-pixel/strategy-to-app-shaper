import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileQuestion, Send } from "lucide-react";

export default function RequestContent() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [contentType, setContentType] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentType || !details) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success("Your request has been submitted successfully");
      setContentType("");
      setDetails("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <FileQuestion className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Request Special Content</h1>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <Input
                  id="contentType"
                  placeholder="e.g., Mock Test, Previous Paper, Study Material"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="details">Request Details</Label>
                <Textarea
                  id="details"
                  placeholder="Describe what content you need..."
                  rows={8}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
