import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";

const plans = [
  {
    name: "Monthly",
    price: "₹299",
    period: "per month",
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
    name: "Yearly",
    price: "₹2,999",
    period: "per year",
    popular: true,
    features: [
      "All Monthly Features",
      "Save 17%",
      "Priority Support",
      "Exclusive Study Material",
      "Referral Bonus",
      "Early Access to New Tests",
    ],
  },
];

export default function Premium() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-secondary" />
            <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
          </div>
          <p className="text-muted-foreground">
            Unlock unlimited access to all features and boost your exam preparation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 ${
                plan.popular ? "border-secondary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                Subscribe Now
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
