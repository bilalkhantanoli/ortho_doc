import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LockKeyhole, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { profile, resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [sessionCheckDone, setSessionCheckDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    const ensureRecoverySession = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          setIsRecoveryReady(true);
          setSessionCheckDone(true);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (mounted) {
        setIsRecoveryReady(false);
        setSessionCheckDone(true);
      }
    };

    void ensureRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRecoveryReady) {
      toast.error('Recovery link is invalid or expired. Please request a new reset email.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(password);
      toast.success('Password updated successfully.');
      navigate(profile ? `/${profile.role}/dashboard` : '/auth/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update your password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[2rem] border bg-card/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-secondary via-primary to-secondary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_24%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              New password
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-5xl font-semibold leading-tight">
                Create a fresh password and continue.
              </h1>
              <p className="max-w-md text-lg leading-8 text-white/85">
                Choose a strong password you have not used before and finish the recovery flow.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Security', value: 'Updated' },
              { label: 'Session', value: 'Restored' },
              { label: 'Access', value: 'Protected' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-border/70 bg-background/90 shadow-none">
              <CardHeader className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Recovery flow
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-3xl tracking-tight">Reset your password</CardTitle>
                  <CardDescription>Enter a new password to finish account recovery.</CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  {sessionCheckDone && !isRecoveryReady && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-foreground">
                      This reset link is invalid or expired. Please go back and request a new one.
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm the new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !sessionCheckDone || !isRecoveryReady}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
