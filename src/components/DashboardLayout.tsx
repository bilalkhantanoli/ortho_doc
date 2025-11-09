import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Upload,
  Calendar,
  Palette,
  FileText,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'doctor' | 'patient';
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
    { href: '/patient/customize', label: 'Customize Brace', icon: Palette },
    { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <Link key={link.href} to={link.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Button>
          </Link>
        );
      })}
      <Button
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
          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
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
                <div className="mb-4 rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
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
    </div>
  );
};

export default DashboardLayout;
