import { useState } from 'react';
import { Users, FileText, Calendar, TrendingUp, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { UploadXrayDialog } from '@/components/modals/UploadXrayDialog';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';
import { useDashboardQuery } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';

const DoctorDashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const { profile } = useAuth();
  const { data, isLoading } = useDashboardQuery('doctor');

  const stats = [
    {
      title: 'Total Patients',
      value: data?.stats.totalPatients ?? 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Active Cases',
      value: data?.stats.activeCases ?? 0,
      icon: FileText,
      color: 'text-secondary',
    },
    {
      title: 'Appointments',
      value: data?.stats.scheduledAppointments ?? 0,
      icon: Calendar,
      color: 'text-accent',
    },
    {
      title: 'Success Rate',
      value: `${data?.stats.successRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-primary/10 via-card to-secondary/10">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Doctor workspace</p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Welcome back, {profile?.fullName ?? 'Doctor'}.
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Review patients, dispatch analyses, and keep appointments moving from one clinical command center.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4" />
                Upload X-ray
              </Button>
              <Button className="gap-2" onClick={() => setShowAppointmentDialog(true)}>
                <Calendar className="h-4 w-4" />
                New Appointment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardDescription>{stat.title}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{stat.value}</CardTitle>
                </div>
                <div className="rounded-2xl bg-muted p-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Refreshing live data...' : 'Live from Supabase'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle>Cases Overview</CardTitle>
              <CardDescription>Monthly case volume and activity trend.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.casesByMonth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Recent patient activity and visit status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentPatients?.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-2xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{patient.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.lastAppointmentAt
                          ? `Last visit: ${new Date(patient.lastAppointmentAt).toLocaleDateString()}`
                          : 'No visits yet'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        patient.relationshipStatus === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {patient.relationshipStatus}
                    </span>
                  </div>
                ))}
                {!isLoading && !data?.recentPatients?.length && (
                  <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No linked patients yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <UploadXrayDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        role="doctor"
      />
      <BookAppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        role="doctor"
      />
    </DashboardLayout>
  );
};

export default DoctorDashboard;
