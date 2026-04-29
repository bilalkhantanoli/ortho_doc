import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, MailCheck, Sparkles, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/domain';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, profile } = useAuth();

  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || 'patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const nextProfile = await register({ fullName: name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');

      if (nextProfile) {
        toast.success('Account created successfully.');
        navigate(`/${nextProfile.role}/dashboard`, { replace: true });
        return;
      }

      toast.success('Confirmation email sent');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (profile) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border bg-card/60 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-primary p-10 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_24%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
                <MailCheck className="h-4 w-4" />
                One account, two care paths
              </div>
              <div className="space-y-4">
                <h1 className="max-w-md text-5xl font-semibold leading-tight">
                  Create your profile and start with a clean, guided setup.
                </h1>
                <p className="max-w-md text-lg leading-8 text-white/85">
                  Choose your role, confirm your email, and keep patient records safely connected to the right workflow.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Setup', value: 'Simple' },
                { label: 'Confirmation', value: 'Required' },
                { label: 'Access', value: 'Role-based' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
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
                  <CardTitle className="text-3xl tracking-tight">Create account</CardTitle>
                  <CardDescription>Sign up as a {role}</CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

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
                        minLength={6}
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
                    Create Account
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already registered?{' '}
                    <Link to={`/auth/login?role=${role}`} className="font-medium text-primary hover:underline">
                      Sign in
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

export default Register;
