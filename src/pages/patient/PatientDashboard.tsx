import { useState } from 'react';
import { Calendar, FileText, Upload, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';
import { UploadXrayDialog } from '@/components/modals/UploadXrayDialog';
import { useDashboardQuery } from '@/hooks/useDashboard';

const PatientDashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const { data } = useDashboardQuery('patient');

  const quickActions = [
    {
      title: 'Upload Image',
      description: 'Get AI analysis of your dental photos',
      icon: Upload,
      onClick: () => setShowUploadDialog(true),
      color: 'bg-gradient-primary',
    },
    {
      title: 'Customize Brace',
      description: 'Choose your brace color and style',
      icon: Palette,
      href: data?.openCases ? '/patient/cases' : undefined,
      color: 'bg-gradient-secondary',
    },
    {
      title: 'My Cases',
      description: 'View your analysis history',
      icon: FileText,
      href: '/patient/cases',
      color: 'bg-primary',
    },
    {
      title: 'Book Appointment',
      description: 'Schedule your next visit',
      icon: Calendar,
      onClick: () => setShowAppointmentDialog(true),
      color: 'bg-secondary',
    },
  ];

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">Track your orthodontic journey</p>
        </div>

        {/* Next Appointment */}
        {data?.nextAppointment && (
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Next Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(data.nextAppointment.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.nextAppointment.scheduledAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    - {data.nextAppointment.appointmentType.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="outline">View Details</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Treatment Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Progress</CardTitle>
            <CardDescription>You're making great progress!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">{data?.treatmentProgress ?? 0}%</span>
              </div>
              <Progress value={data?.treatmentProgress ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data?.openCases
                  ? `${data.openCases} active case(s) still in progress`
                  : 'No active treatment cases yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const content = (
                <Card className="group h-full cursor-pointer transition-all hover:shadow-lg">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className={`mb-4 rounded-lg ${action.color} p-3`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              );

              return action.href ? (
                <Link key={action.title} to={action.href}>
                  {content}
                </Link>
              ) : (
                <div key={action.title} onClick={action.onClick}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadXrayDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        role="patient"
      />
      <BookAppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        role="patient"
      />
    </DashboardLayout>
  );
};

export default PatientDashboard;
