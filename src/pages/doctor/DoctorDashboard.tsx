import { useMemo, useState } from 'react';
import { Calendar, FileText, FolderKanban, ListChecks, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';
import { useDashboardQuery } from '@/hooks/useDashboard';
import { useAppointmentsQuery } from '@/hooks/useAppointments';
import { useCasesQuery } from '@/hooks/useCases';
import { APPOINTMENT_TIME_SLOTS } from '@/lib/constants';
import { getSlotDisplayLabel } from '@/lib/healthcare';
import type { Appointment } from '@/lib/domain';

const getScheduleStatus = (appointment: Appointment) => {
  const scheduled = new Date(appointment.scheduledAt);
  const now = new Date();
  const end = new Date(scheduled.getTime() + appointment.durationMinutes * 60 * 1000);

  if (appointment.status === 'completed') {
    return 'Completed';
  }

  if (appointment.status === 'cancelled') {
    return 'Cancelled';
  }

  if (now >= scheduled && now <= end) {
    return 'In Progress';
  }

  return 'Waiting';
};

const DoctorDashboard = () => {
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { data } = useDashboardQuery('doctor');
  const { data: appointments = [] } = useAppointmentsQuery('doctor');
  const { data: cases = [] } = useCasesQuery('doctor');

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const todayAppointments = useMemo(
    () =>
      appointments.filter((appointment) => appointment.scheduledAt.startsWith(todayKey)),
    [appointments, todayKey],
  );

  const missedAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const scheduled = new Date(appointment.scheduledAt);
        return appointment.status === 'scheduled' && scheduled.getTime() < nowMinusMinutes(15);
      }),
    [appointments],
  );

  const scheduleMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    todayAppointments.forEach((appointment) => {
      map.set(new Date(appointment.scheduledAt).toISOString().slice(11, 16), appointment);
    });
    return map;
  }, [todayAppointments]);

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
      icon: Sparkles,
      color: 'text-success',
    },
  ];

  const activeCases = cases.filter((caseItem) => caseItem.status !== 'approved');
  const recentCases = cases.slice(0, 5);

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-primary/10 via-card to-secondary/10">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Doctor workspace
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Daily care operations
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Review today’s schedule, case history, and slot occupancy from one clinical control center.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/doctor/appointments">
                  <Calendar className="h-4 w-4" />
                  Open schedule
                </Link>
              </Button>
              <Button className="gap-2" onClick={() => setShowAppointmentDialog(true)}>
                <ListChecks className="h-4 w-4" />
                Reschedule
              </Button>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-xs text-muted-foreground">Real-time data from Supabase</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Daily Schedule
              </CardTitle>
              <CardDescription>Today’s patients and live status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.length ? (
                todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.appointmentType.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.scheduledAt), 'p')}
                      </p>
                    </div>
                    <Badge variant={getScheduleStatus(appointment) === 'Completed' ? 'default' : 'secondary'}>
                      {getScheduleStatus(appointment)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No appointments scheduled for today.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-secondary" />
                Alerts & Rescheduling
              </CardTitle>
              <CardDescription>Missed appointments need immediate follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {missedAppointments.length ? (
                missedAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">Missed Appointment</p>
                      <Badge variant="outline" className="border-warning/30 text-warning">
                        Missed
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {appointment.patientName} on {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <Button
                      className="mt-3 w-full"
                      onClick={() => {
                        setEditingAppointment(appointment);
                        setShowAppointmentDialog(true);
                      }}
                    >
                      Reschedule instantly
                    </Button>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No missed visits right now.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Slot Management
              </CardTitle>
              <CardDescription>Booked slots are locked for the day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {APPOINTMENT_TIME_SLOTS.map((slot) => {
                  const appointment = scheduleMap.get(slot);

                  return (
                    <Badge
                      key={slot}
                      variant={appointment ? 'default' : 'secondary'}
                      className="rounded-full px-3 py-1"
                    >
                      {getSlotDisplayLabel(slot)}
                      {' '}
                      {appointment ? 'Booked' : 'Open'}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayAppointments.length} of {APPOINTMENT_TIME_SLOTS.length} slots are booked today.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Case Management
              </CardTitle>
              <CardDescription>Recent cases and patient history review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCases.length ? (
                recentCases.map((caseItem) => (
                  <div key={caseItem.id} className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{caseItem.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.patientName} · {new Date(caseItem.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{caseItem.status}</Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/doctor/analysis-result/${caseItem.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No recent cases found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BookAppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={(open) => {
          setShowAppointmentDialog(open);
          if (!open) {
            setEditingAppointment(null);
          }
        }}
        role="doctor"
        appointment={editingAppointment}
      />
    </DashboardLayout>
  );
};

const nowMinusMinutes = (minutes: number) => Date.now() - minutes * 60 * 1000;

export default DoctorDashboard;
