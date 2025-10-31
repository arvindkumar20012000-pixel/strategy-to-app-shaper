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
import { HelpCircle, Send } from "lucide-react";

export default function DoubtClearance() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [doubt, setDoubt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !doubt) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      toast.success("Your doubt has been submitted successfully");
      setSubject("");
      setDoubt("");
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
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Doubt Clearance</h1>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Physics, General Knowledge"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="doubt">Describe your doubt</Label>
                <Textarea
                  id="doubt"
                  placeholder="Explain your doubt in detail..."
                  rows={8}
                  value={doubt}
                  onChange={(e) => setDoubt(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit Doubt"}
              </Button>
            </form>
          </Card>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Submit your doubt with a clear description</li>
              <li>• Our expert team will review your question</li>
              <li>• You'll receive a detailed answer within 24 hours</li>
              <li>• Premium members get priority responses</li>
            </ul>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
