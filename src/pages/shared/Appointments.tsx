import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DashboardLayout from '@/components/DashboardLayout';
import { BookAppointmentDialog } from '@/components/modals/BookAppointmentDialog';
import { useAppointmentsQuery, useUpdateAppointmentStatusMutation } from '@/hooks/useAppointments';
import type { Appointment } from '@/lib/domain';
import { formatAppointmentType } from '@/lib/domain';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface AppointmentsProps {
  role: 'doctor' | 'patient';
}

const Appointments = ({ role }: AppointmentsProps) => {
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const { data: appointments = [], isLoading } = useAppointmentsQuery(role);
  const updateStatusMutation = useUpdateAppointmentStatusMutation(role);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground">Manage your appointments</p>
          </div>
          <Button className="gap-2" onClick={() => setShowBookDialog(true)}>
            <CalendarIcon className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>

        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {role === 'doctor' ? appointment.patientName : appointment.doctorName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{formatAppointmentType(appointment.appointmentType)}</p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(appointment.scheduledAt).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {role === 'patient' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{appointment.doctorName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingAppointment(appointment);
                          setShowBookDialog(true);
                        }}>
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setAppointmentToCancel(appointment)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoading && appointments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No appointments scheduled</p>
              <Button className="mt-4">Book Your First Appointment</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <BookAppointmentDialog
        open={showBookDialog}
        onOpenChange={(open) => {
          setShowBookDialog(open);
          if (!open) {
            setEditingAppointment(null);
          }
        }}
        role={role}
        appointment={editingAppointment}
      />

      <AlertDialog
        open={Boolean(appointmentToCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setAppointmentToCancel(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment for{' '}
              {appointmentToCancel
                ? `${role === 'doctor' ? appointmentToCancel.patientName : appointmentToCancel.doctorName} on ${new Date(appointmentToCancel.scheduledAt).toLocaleDateString()}`
                : 'this appointment'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentToCancel(null)}>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!appointmentToCancel) return;

                try {
                  await updateStatusMutation.mutateAsync({
                    appointmentId: appointmentToCancel.id,
                    status: 'cancelled',
                  });
                  toast.success('Appointment cancelled.');
                } catch (error) {
                  toast.error(getErrorMessage(error, 'Unable to cancel the appointment.'));
                } finally {
                  setAppointmentToCancel(null);
                }
              }}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Appointments;
