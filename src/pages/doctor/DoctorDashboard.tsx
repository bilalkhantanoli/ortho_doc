import { useState } from 'react';
import { Users, FileText, Calendar, TrendingUp, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.fullName ?? 'Doctor'}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4" />
              Upload X-ray
            </Button>
            <Button className="gap-2" onClick={() => setShowAppointmentDialog(true)}>
              <Calendar className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Loading...' : 'Live from Supabase'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cases Overview</CardTitle>
            </CardHeader>
            <CardContent>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentPatients?.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border p-3"
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
                  <p className="text-sm text-muted-foreground">No linked patients yet.</p>
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
