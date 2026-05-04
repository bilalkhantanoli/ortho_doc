import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const ForgotPassword = () => {
  const { profile, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success('Password reset email sent.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to send reset email.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (profile) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[2rem] border bg-card/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_24%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Account recovery
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-5xl font-semibold leading-tight">
                Reset access without interrupting your workflow.
              </h1>
              <p className="max-w-md text-lg leading-8 text-white/85">
                We will send a secure recovery link to your email so you can create a new password and get back in.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Email link', value: 'Secure' },
              { label: 'Recovery', value: 'Fast' },
              { label: 'Return', value: 'Simple' },
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
                <Button asChild variant="ghost" className="w-fit gap-2 px-0 text-muted-foreground hover:text-primary">
                  <Link to="/auth/login">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-3xl tracking-tight">Forgot password?</CardTitle>
                  <CardDescription>Enter your email and we will send a recovery link.</CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {sent && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                      If the email is registered, a password reset link has been sent.
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send reset link
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

export default ForgotPassword;
