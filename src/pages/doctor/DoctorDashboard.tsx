import { useState } from 'react';
import { Users, FileText, Calendar, TrendingUp, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { mockPatients, mockCases, mockAppointments } from '@/lib/mockData';
import { UploadXrayDialog } from '@/components/modals/UploadXrayDialog';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';

const DoctorDashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);

  const stats = [
    {
      title: 'Total Patients',
      value: mockPatients.length,
      icon: Users,
      change: '+12%',
      color: 'text-primary',
    },
    {
      title: 'Active Cases',
      value: mockCases.filter((c) => c.status !== 'approved').length,
      icon: FileText,
      change: '+8%',
      color: 'text-secondary',
    },
    {
      title: 'Appointments',
      value: mockAppointments.filter((a) => a.status === 'scheduled').length,
      icon: Calendar,
      change: '+5%',
      color: 'text-accent',
    },
    {
      title: 'Success Rate',
      value: '94%',
      icon: TrendingUp,
      change: '+2%',
      color: 'text-success',
    },
  ];

  const chartData = [
    { month: 'Jan', cases: 12 },
    { month: 'Feb', cases: 19 },
    { month: 'Mar', cases: 15 },
    { month: 'Apr', cases: 25 },
    { month: 'May', cases: 22 },
    { month: 'Jun', cases: 30 },
  ];

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Doctor!</p>
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
                <p className="text-xs text-success">
                  {stat.change} from last month
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
                <BarChart data={chartData}>
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
                {mockPatients.slice(0, 4).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        patient.status === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {patient.status}
                    </span>
                  </div>
                ))}
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
