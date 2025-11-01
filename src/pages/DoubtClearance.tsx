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
import { HelpCircle, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DoubtClearance() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [doubt, setDoubt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !doubt) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setAiResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-doubt-helper', {
        body: { subject, doubt }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAiResponse(data.answer);
      toast.success("AI response received!");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">AI Doubt Helper</h1>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </div>

          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Free AI-powered instant answers using Lovable AI
            </p>
          </Card>

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
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? "Getting AI Answer..." : "Get Instant AI Answer"}
              </Button>
            </form>
          </Card>

          {aiResponse && (
            <Card className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">AI Answer</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{aiResponse}</p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSubject("");
                  setDoubt("");
                  setAiResponse("");
                }}
              >
                Ask Another Question
              </Button>
            </Card>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Ask any educational question</li>
              <li>• Get instant AI-powered answers</li>
              <li>• Completely free - powered by Lovable AI</li>
              <li>• Available 24/7 for all subjects</li>
            </ul>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
