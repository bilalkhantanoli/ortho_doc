import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Download,
  FileText,
  HeartPulse,
  MessageCircleHeart,
  ScanFace,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';
import { UploadXrayDialog } from '@/components/modals/UploadXrayDialog';
import { useDashboardQuery } from '@/hooks/useDashboard';
import { useAppointmentsQuery, useDoctorsQuery } from '@/hooks/useAppointments';
import { useCasesQuery } from '@/hooks/useCases';
import { buildDoctorCards, buildMedicalHistory, buildNotificationItems, buildReportRows, filterAvailableSlots, getSlotDisplayLabel } from '@/lib/healthcare';
import { cn } from '@/lib/utils';
import { getDoctorBookedSlots } from '@/lib/supabase/services/appointments';

const notificationStyles = {
  success: 'border-success/30 bg-success/5 text-success',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  info: 'border-primary/30 bg-primary/5 text-primary',
} as const;

const PatientDashboard = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [workspaceNotifications, setWorkspaceNotifications] = useState(buildNotificationItems([]));
  const hasReminderBeenShown = useRef<Set<string>>(new Set());

  const { data: dashboardData } = useDashboardQuery('patient');
  const { data: appointments = [] } = useAppointmentsQuery('patient');
  const { data: cases = [] } = useCasesQuery('patient');
  const { data: doctors = [] } = useDoctorsQuery();

  const doctorCards = useMemo(() => buildDoctorCards(doctors, cases, appointments), [appointments, cases, doctors]);
  const medicalHistory = useMemo(() => buildMedicalHistory(cases, appointments), [appointments, cases]);
  const reports = useMemo(() => buildReportRows(cases), [cases]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const doctorAvailabilityQueries = useQueries({
    queries: doctorCards.map((doctor) => ({
      queryKey: ['doctor-booked-slots', doctor.id, todayKey],
      queryFn: () => getDoctorBookedSlots(doctor.id, todayKey),
      enabled: Boolean(doctor.id),
    })),
  });

  useEffect(() => {
    setWorkspaceNotifications((current) => {
      const derivedNotifications = buildNotificationItems(appointments);
      const seenIds = new Set(current.map((item) => item.id));

      return [
        ...current,
        ...derivedNotifications.filter((item) => !seenIds.has(item.id)),
      ];
    });
  }, [appointments]);

  useEffect(() => {
    const reminder = dashboardData?.nextAppointment;
    if (!reminder) {
      return;
    }

    const scheduled = new Date(reminder.scheduledAt);
    const diffHours = (scheduled.getTime() - Date.now()) / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours >= 0 && !hasReminderBeenShown.current.has(reminder.id)) {
      hasReminderBeenShown.current.add(reminder.id);
      setWorkspaceNotifications((current) => [
        {
          id: `reminder-${reminder.id}`,
          title: 'Appointment Reminder',
          detail: `${reminder.doctorName} on ${scheduled.toLocaleDateString()} at ${scheduled.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}`,
          variant: 'info',
          timestamp: reminder.scheduledAt,
        },
        ...current,
      ]);
    }
  }, [dashboardData?.nextAppointment]);

  useEffect(() => {
    if (!selectedDoctorId && doctorCards.length) {
      setSelectedDoctorId(doctorCards[0].id);
    }
  }, [doctorCards, selectedDoctorId]);

  const selectedDoctor = doctorCards.find((doctor) => doctor.id === selectedDoctorId) ?? doctorCards[0];

  const nextAppointment = dashboardData?.nextAppointment;
  const openCases = dashboardData?.openCases ?? 0;
  const treatmentProgress = dashboardData?.treatmentProgress ?? 0;

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-primary/10 via-card to-secondary/10">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Patient workspace
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Your care, your schedule, your records.
                </h1>
                <p className="max-w-2xl text-muted-foreground">
                  See personalized doctor recommendations, book in a few steps, and keep every report and treatment note in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => setShowAppointmentDialog(true)}>
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4" />
                  Upload Scan
                </Button>
                <Button variant="ghost" className="gap-2" asChild>
                  <Link to="/patient/reports">
                    <Download className="h-4 w-4" />
                    Reports
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-border/60 bg-background/70">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Open cases</p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">{openCases}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background/70">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Treatment progress</p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">{treatmentProgress}%</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background/70 sm:col-span-2">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Notifications</p>
                    <Badge variant="secondary">{workspaceNotifications.length}</Badge>
                  </div>
                  <Separator />
                  {workspaceNotifications.slice(0, 2).map((item) => (
                    <div key={item.id} className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-primary" />
                Smart Doctor Recommendations
              </CardTitle>
              <CardDescription>
                Contextual suggestions based on your recent cases and treatment history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {doctorCards.map((doctor, index) => {
                  const bookedSlots = (doctorAvailabilityQueries[index]?.data as string[] | undefined) ?? [];
                  const availableSlots = filterAvailableSlots(bookedSlots);

                  return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(doctor.id);
                      setShowAppointmentDialog(true);
                    }}
                    className={cn(
                      'rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
                      selectedDoctor?.id === doctor.id ? 'border-primary bg-primary/5' : 'bg-card',
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{doctor.fullName}</h3>
                            <Badge variant="secondary">{doctor.recommendationLabel}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{doctor.careFocus}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>{doctor.patientCount} visit{doctor.patientCount === 1 ? '' : 's'} on file</span>
                          <span>{doctor.recentVisitLabel}</span>
                        </div>

                        <p className="max-w-xl text-sm text-muted-foreground">{doctor.careSummary}</p>
                      </div>

                      <div className="min-w-[180px] space-y-3 rounded-2xl bg-background/70 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Feedback</p>
                            <p className="text-base font-semibold text-foreground">Real chart notes</p>
                          </div>
                          <HeartPulse className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">{doctor.reviewLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {availableSlots.length ? availableSlots.map((slot) => (
                        <Badge key={slot} variant="outline" className="rounded-full px-3 py-1">
                          {getSlotDisplayLabel(slot)}
                        </Badge>
                      )) : (
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          Fully booked today
                        </Badge>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleHeart className="h-5 w-5 text-secondary" />
                  Real-time Notifications
                </CardTitle>
                <CardDescription>Booking confirmations and appointment reminders appear here instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {workspaceNotifications.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : (
                  workspaceNotifications.slice(0, 4).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'rounded-2xl border p-4',
                        notificationStyles[notification.variant],
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{notification.title}</p>
                        <Badge variant="outline" className="border-current/30 bg-transparent text-[10px] uppercase">
                          {notification.variant}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm opacity-80">{notification.detail}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Next Appointment
                </CardTitle>
                <CardDescription>Upcoming visit and quick action.</CardDescription>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-muted/20 p-4">
                      <p className="text-sm font-medium text-foreground">{nextAppointment.doctorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(nextAppointment.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(nextAppointment.scheduledAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {' '}
                        - {nextAppointment.appointmentType.replace('_', ' ')}
                      </p>
                    </div>
                    <Button className="w-full" onClick={() => setShowAppointmentDialog(true)}>
                      View or reschedule
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No scheduled appointment yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reports
              </CardTitle>
              <CardDescription>Organized by date, report type, and doctor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.slice(0, 3).map((report) => (
                <div key={report.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{report.title}</p>
                      <p className="text-sm text-muted-foreground">{report.type}</p>
                    </div>
                    <Badge variant="secondary">{report.doctor}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/patient/reports">Open reports tab</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-secondary" />
                Medical History
              </CardTitle>
              <CardDescription>Past treatments, diagnoses, and previous appointments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {medicalHistory.slice(0, 6).map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border bg-muted/20 p-4">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <Badge variant={item.tone === 'success' ? 'default' : 'secondary'} className="capitalize">
                        {item.tone}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadXrayDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} role="patient" />
      <BookAppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        role="patient"
        initialDoctorId={selectedDoctor?.id}
        onBooked={({ doctorId }) => {
          setSelectedDoctorId(doctorId);
          setWorkspaceNotifications((current) => [
            {
              id: `confirmed-${doctorId}-${Date.now()}`,
              title: 'Appointment Confirmed',
              detail: 'Your booking has been saved and the slot is now reserved.',
              variant: 'success',
              timestamp: new Date().toISOString(),
            },
            ...current,
          ]);
        }}
      />
    </DashboardLayout>
  );
};

export default PatientDashboard;
