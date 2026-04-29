import { ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Upload,
  Calendar,
  FileText,
  LogOut,
  Menu,
  UserCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'doctor' | 'patient';
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const profileDetails = useMemo(
    () => [
      { label: 'Name', value: profile?.fullName ?? 'Unknown' },
      { label: 'Email', value: profile?.email ?? 'Unknown' },
      { label: 'Role', value: profile?.role ?? 'Unknown' },
      { label: 'Age', value: profile?.age?.toString() ?? 'N/A' },
      { label: 'Phone', value: profile?.phone ?? 'N/A' },
    ],
    [profile],
  );

  const doctorLinks = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/upload', label: 'Upload', icon: Upload },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  ];

  const patientLinks = [
    { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patient/upload', label: 'Upload', icon: Upload },
    { href: '/patient/cases', label: 'My Cases', icon: FileText },
    { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <Button asChild key={link.href} variant={isActive ? 'default' : 'ghost'} className="w-full justify-start gap-3">
            <Link to={link.href}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          </Button>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">OrthoDoc AI</h1>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <button
            type="button"
            onClick={() => setShowAccountDialog(true)}
            className="mb-4 w-full rounded-lg bg-muted p-3 text-left transition-colors hover:bg-muted/80"
          >
            <p className="text-sm font-medium text-foreground">{profile?.fullName}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </button>
          <NavLinks />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <h1 className="text-lg font-bold text-primary">OrthoDoc AI</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-xl font-bold text-primary">OrthoDoc AI</h1>
              </div>
              <nav className="flex flex-col gap-2 p-4">
                <button
                  type="button"
                  onClick={() => setShowAccountDialog(true)}
                  className="mb-4 w-full rounded-lg bg-muted p-3 text-left transition-colors hover:bg-muted/80"
                >
                  <p className="text-sm font-medium text-foreground">{profile?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </button>
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-primary" />
              Account Info
            </DialogTitle>
            <DialogDescription>
              Review the profile details linked to this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {profileDetails.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setShowAccountDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
