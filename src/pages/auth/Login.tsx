import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/domain';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, profile } = useAuth();

  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || 'patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const nextProfile = await login(email, password);
      toast.success('Login successful!');
      navigate(`/${nextProfile?.role ?? role}/dashboard`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (profile) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border bg-card/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),_transparent_24%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Secure access for clinical teams
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-5xl font-semibold leading-tight">
                Return to your care workflow without the clutter.
              </h1>
              <p className="max-w-md text-lg leading-8 text-white/85">
                Sign in to review patients, manage appointments, and monitor treatment progress from one place.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Patient review', value: 'Fast' },
              { label: 'Records', value: 'Managed' },
              { label: 'Workflow', value: 'Focused' },
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
              <CardHeader className="space-y-5">
                <div className="flex justify-center gap-2">
                  <Button type="button" variant={role === 'doctor' ? 'default' : 'outline'} size="sm" onClick={() => setRole('doctor')} className="gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Doctor
                  </Button>
                  <Button type="button" variant={role === 'patient' ? 'default' : 'outline'} size="sm" onClick={() => setRole('patient')} className="gap-2">
                    <User className="h-4 w-4" />
                    Patient
                  </Button>
                </div>
                <div className="space-y-2 text-center">
                  <CardTitle className="text-3xl tracking-tight">Welcome back</CardTitle>
                  <CardDescription>Sign in to your {role} account</CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    New here?{' '}
                    <Link to={`/auth/register?role=${role}`} className="font-medium text-primary hover:underline">
                      Create an account
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Login;
