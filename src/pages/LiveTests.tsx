import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Users, Clock } from "lucide-react";

const liveTests = [
  {
    id: 1,
    title: "SSC CGL Mock Test 2024",
    participants: 1245,
    startTime: "10:00 AM",
    duration: "2 hours",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Railway RRB NTPC Practice Test",
    participants: 890,
    startTime: "2:00 PM",
    duration: "90 minutes",
    status: "upcoming",
  },
];

export default function LiveTests() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <Radio className="w-6 h-6 text-destructive" />
          <h1 className="text-2xl font-bold">Live Tests</h1>
        </div>

        <div className="space-y-4">
          {liveTests.map((test) => (
            <Card key={test.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{test.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{test.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Radio className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Starts at {test.startTime}</span>
                <Button>Register Now</Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
