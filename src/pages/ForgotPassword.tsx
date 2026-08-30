import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput } from "@/components/PasswordInput";
import { BookOpen, Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Step = "email" | "otp" | "password";

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setStep("otp");
      setCode("");
      setResendIn(45);
      toast.success("We sent a 6-digit reset code to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (token: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "recovery",
      });
      if (error) throw error;
      setStep("password");
      toast.success("Code verified — set your new password");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl text-foreground">StudyByte</h1>
          <p className="text-muted-foreground mt-1">Reset your password with an email code</p>
        </div>

        <Card className="shadow-lg border-border">
          {step === "email" && (
            <>
              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a 6-digit reset code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {loading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "otp" && (
            <>
              <CardHeader>
                <CardTitle>Enter Reset Code</CardTitle>
                <CardDescription>We sent a 6-digit code to {email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(v) => {
                      setCode(v);
                      if (v.length === 6) verifyCode(v);
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  disabled={loading || code.length !== 6}
                  onClick={() => verifyCode(code)}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-sm"
                    disabled={loading || resendIn > 0}
                    onClick={() => sendCode()}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-sm text-muted-foreground"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                    }}
                  >
                    Change email
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "password" && (
            <>
              <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>Choose a strong password for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={updatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <PasswordInput
                      id="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
