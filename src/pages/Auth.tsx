import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Mail, User, Download, X, ArrowLeft } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PasswordInput } from "@/components/PasswordInput";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const [loading, setLoading] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (refCode) localStorage.setItem("pending_referral_code", refCode);
  }, [refCode]);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = loginSchema.parse(loginData);
      await signIn(validated.email, validated.password);
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const linkReferral = async () => {
    const code = localStorage.getItem("pending_referral_code");
    if (!code) return;
    try {
      const { data: refRow } = await supabase
        .from("referrals")
        .select("referrer_id")
        .eq("referral_code", code)
        .is("referred_id", null)
        .maybeSingle();
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (refRow && newUser && refRow.referrer_id !== newUser.id) {
        await supabase.from("referrals").insert({
          referrer_id: refRow.referrer_id,
          referred_id: newUser.id,
          referral_code: code,
          status: "pending",
        });
      }
      localStorage.removeItem("pending_referral_code");
    } catch (e) {
      console.error("Referral link failed:", e);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = signupSchema.parse(signupData);
      await signUp(validated.email, validated.password, validated.fullName);
      await linkReferral();
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-background">
      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && isInstallable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Install StudyByte App</p>
              <p className="text-xs text-muted-foreground">Quick access, works offline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={installApp}>
              Install
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowInstallBanner(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editorial brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-background/15 backdrop-blur flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-display text-3xl leading-none">StudyByte</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-5xl leading-tight text-primary-foreground">
            Prepare a little, every single day.
          </h1>
          <p className="mt-5 text-base text-primary-foreground/80 leading-relaxed">
            Daily current affairs, NCERT libraries, previous year papers and full CBT-style mock
            tests — all in one calm, focused workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/85">
            <li>• Fresh news digests within 48 hours</li>
            <li>• Real exam-pattern mock tests with analysis</li>
            <li>• Streaks, leaderboards and progress analytics</li>
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} StudyByte. Built for serious aspirants.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl text-foreground">StudyByte</h1>
            <p className="text-muted-foreground mt-1">Your daily exam preparation companion</p>
          </div>

          <Card className="shadow-lg border-border">

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Log In</TabsTrigger>
            </TabsList>



            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                   <div className="space-y-2">
                     <Label htmlFor="login-password">Password</Label>
                     <PasswordInput
                       id="login-password"
                       placeholder="••••••••"
                       value={loginData.password}
                       onChange={(e) =>
                         setLoginData({ ...loginData, password: e.target.value })
                       }
                       required
                     />
                     {errors.password && (
                       <p className="text-sm text-destructive">{errors.password}</p>
                     )}
                   </div>

                   <Button 
                     type="button" 
                     variant="link" 
                     className="px-0 h-auto text-sm"
                     onClick={() => navigate("/forgot-password")}
                   >
                     Forgot password?
                   </Button>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Sign up to start your exam preparation journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signupData.fullName}
                        onChange={(e) =>
                          setSignupData({ ...signupData, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                   <div className="space-y-2">
                     <Label htmlFor="signup-password">Password</Label>
                     <PasswordInput
                       id="signup-password"
                       placeholder="••••••••"
                       value={signupData.password}
                       onChange={(e) =>
                         setSignupData({ ...signupData, password: e.target.value })
                       }
                       required
                     />
                     {errors.password && (
                       <p className="text-sm text-destructive">{errors.password}</p>
                     )}
                   </div>

                   <p className="text-xs text-muted-foreground">
                     No email verification needed — you're in instantly.
                   </p>


                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
          </Card>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Auth;
