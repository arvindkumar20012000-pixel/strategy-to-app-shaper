import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
    price: "₹299",
    amount: 299,
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
    name: "Yearly",
    price: "₹2,999",
    amount: 2999,
    period: "per year",
    planType: "yearly",
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
  const [loading, setLoading] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch current subscription
    if (user) {
      fetchSubscription();
    }

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (data && new Date(data.end_date) > new Date()) {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Please login to subscribe');
      navigate('/auth');
      return;
    }

    if (currentSubscription) {
      toast.info('You already have an active subscription');
      return;
    }

    setLoading(plan.planType);

    try {
      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            planType: plan.planType,
            amount: plan.amount,
          },
        }
      );

      if (orderError || orderData?.error) {
        throw new Error(orderData?.error || 'Failed to create order');
      }

      console.log('Order created:', orderData);

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StudyByte',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          console.log('Payment successful:', response);
          
          // Verify payment on server
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            'verify-razorpay-payment',
            {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: plan.planType,
                amount: plan.amount,
                userId: user.id,
              },
            }
          );

          if (verifyError || verifyData?.error) {
            toast.error('Payment verification failed');
            return;
          }

          toast.success('Subscription activated successfully!');
          fetchSubscription();
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="max-w-screen-xl mx-auto px-3 pt-16 pb-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-secondary" />
            <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
          </div>
          <p className="text-muted-foreground">
            Unlock unlimited access to all features and boost your exam preparation
          </p>
        </div>

        {currentSubscription && (
          <Card className="p-4 mb-6 max-w-md mx-auto bg-secondary/10 border-secondary">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-secondary" />
              <span className="font-semibold">Active Subscription</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentSubscription.plan_type.charAt(0).toUpperCase() + currentSubscription.plan_type.slice(1)} plan • 
              Expires: {new Date(currentSubscription.end_date).toLocaleDateString()}
            </p>
          </Card>
        )}

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
                onClick={() => handleSubscribe(plan)}
                disabled={loading !== null || !!currentSubscription}
              >
                {loading === plan.planType ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentSubscription ? (
                  'Already Subscribed'
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
