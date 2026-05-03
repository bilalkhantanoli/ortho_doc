import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  User2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDoctorsQuery, useCreateAppointmentMutation, useUpdateAppointmentMutation } from '@/hooks/useAppointments';
import { useDoctorAvailabilityQuery } from '@/hooks/useAppointments';
import { usePatientsQuery } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { formatAppointmentType, type Appointment, type AppointmentType } from '@/lib/domain';
import { APPOINTMENT_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { filterAvailableSlots, getSlotDisplayLabel } from '@/lib/healthcare';

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'doctor' | 'patient';
  appointment?: Appointment | null;
  initialDoctorId?: string;
  initialAppointmentType?: AppointmentType;
  onBooked?: (appointment: {
    doctorId: string;
    patientId: string;
    scheduledAt: string;
    appointmentType: AppointmentType;
  }) => void;
}

export const BookAppointmentDialog = ({
  open,
  onOpenChange,
  role,
  appointment,
  initialDoctorId,
  initialAppointmentType,
  onBooked,
}: BookAppointmentDialogProps) => {
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<Date>();
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const { data: doctors = [] } = useDoctorsQuery();
  const { data: patients = [] } = usePatientsQuery(undefined, role === 'doctor');
  const createAppointmentMutation = useCreateAppointmentMutation(role);
  const updateAppointmentMutation = useUpdateAppointmentMutation(role);
  const availabilityDoctorId = role === 'doctor' ? profile?.id : selectedDoctor;
  const { data: availability } = useDoctorAvailabilityQuery(availabilityDoctorId, date);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!appointment) {
      setStep(0);
      setDate(undefined);
      setSelectedDoctor(initialDoctorId ?? '');
      setSelectedPatient('');
      setSelectedTime('');
      setAppointmentType(initialAppointmentType ?? '');
      return;
    }

    const scheduled = new Date(appointment.scheduledAt);
    setStep(0);
    setDate(scheduled);
    setSelectedDoctor(appointment.doctorId);
    setSelectedPatient(appointment.patientId);
    setSelectedTime(scheduled.toISOString().slice(11, 16));
    setAppointmentType(appointment.appointmentType);
  }, [appointment, initialAppointmentType, initialDoctorId, open]);

  const selectedDoctorName = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctor)?.fullName ?? 'Choose a doctor',
    [doctors, selectedDoctor],
  );

  const selectedDoctorSlots = useMemo(() => {
    if (!date) {
      return filterAvailableSlots([]);
    }

    return availability?.availableSlots ?? filterAvailableSlots([]);
  }, [availability?.availableSlots, date]);

  const stepLabels = role === 'doctor' ? ['Patient', 'Time', 'Confirm'] : ['Doctor', 'Time', 'Confirm'];
  const isLastStep = step === stepLabels.length - 1;

  const currentSummary = {
    doctor: role === 'doctor' ? (profile?.fullName ?? 'You') : selectedDoctorName,
    patient:
      role === 'doctor'
        ? patients.find((patient) => patient.id === selectedPatient)?.fullName ?? 'Choose a patient'
        : profile?.fullName ?? 'You',
    date: date ? format(date, 'PPP') : 'Select a date',
    time: selectedTime ? getSlotDisplayLabel(selectedTime) : 'Select a time',
    type: appointmentType ? formatAppointmentType(appointmentType as AppointmentType) : 'Select a visit type',
  };

  const handleSubmit = async () => {
    const resolvedDoctorId = role === 'patient' ? selectedDoctor : profile?.id ?? '';
    const resolvedPatientId = role === 'doctor' ? selectedPatient : profile?.id ?? '';

    if (!date || !selectedTime || !appointmentType || !resolvedDoctorId || !resolvedPatientId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledAt = new Date(`${format(date, 'yyyy-MM-dd')}T${selectedTime}:00`).toISOString();

    try {
      if (appointment) {
        await updateAppointmentMutation.mutateAsync({
          appointmentId: appointment.id,
          scheduledAt,
          appointmentType: appointmentType as AppointmentType,
        });
      } else {
        await createAppointmentMutation.mutateAsync({
          doctorId: resolvedDoctorId,
          patientId: resolvedPatientId,
          scheduledAt,
          appointmentType: appointmentType as AppointmentType,
        });
      }

      toast.success('Appointment Confirmed');
      onBooked?.({
        doctorId: resolvedDoctorId,
        patientId: resolvedPatientId,
        scheduledAt,
        appointmentType: appointmentType as AppointmentType,
      });
      onOpenChange(false);
      setDate(undefined);
      setSelectedDoctor(initialDoctorId ?? '');
      setSelectedPatient('');
      setSelectedTime('');
      setAppointmentType(initialAppointmentType ?? '');
      setStep(0);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save appointment.'));
    }
  };

  const advanceStep = () => {
    if (step === 0) {
      const requiredSelection = role === 'doctor' ? selectedPatient : selectedDoctor;
      if (!requiredSelection) {
        toast.error(`Please choose a ${role === 'doctor' ? 'patient' : 'doctor'} first.`);
        return;
      }
    }

    if (step === 1 && (!date || !selectedTime)) {
      toast.error('Pick a date and time before continuing.');
      return;
    }

    setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {appointment ? 'Reschedule Appointment' : 'Book Appointment'}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {stepLabels.length}. Confirm the visit, then the slot becomes reserved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {stepLabels.map((label, index) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                  index === step ? 'border-primary bg-primary/5' : 'bg-muted/20',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                    index <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {index < step ? 'Complete' : index === step ? 'Current step' : 'Upcoming'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              {role === 'patient' && step === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="doctor">Select Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger id="doctor">
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === 'doctor' && step === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="patient">Select Patient *</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger id="patient">
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Select Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(value) => value < new Date() || value < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Select Time *</Label>
                      <span className="text-xs text-muted-foreground">
                        {selectedDoctor ? `Suggested for ${selectedDoctorName}` : 'Choose a doctor first'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {selectedDoctorSlots.map((time) => {
                        const isBlocked = Boolean(
                          date &&
                            availability?.bookedSlots?.includes(time) &&
                            !(
                              appointment &&
                              new Date(appointment.scheduledAt).toISOString().slice(0, 10) === format(date, 'yyyy-MM-dd') &&
                              new Date(appointment.scheduledAt).toISOString().slice(11, 16) === time
                            ),
                        );

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => {
                              if (!isBlocked) {
                                setSelectedTime(time);
                              }
                            }}
                            className={cn(
                              'rounded-xl border px-3 py-2 text-sm transition-colors',
                              isBlocked && 'cursor-not-allowed border-muted bg-muted/40 text-muted-foreground',
                              selectedTime === time && !isBlocked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : !isBlocked && 'bg-background hover:border-primary/50 hover:bg-muted/40',
                            )}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Review appointment details
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Doctor</p>
                        <p className="font-medium text-foreground">{currentSummary.doctor}</p>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
                        <p className="font-medium text-foreground">{currentSummary.patient}</p>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">{currentSummary.date}</p>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                        <p className="font-medium text-foreground">{currentSummary.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type *</Label>
                    <Select value={appointmentType} onValueChange={setAppointmentType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPOINTMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatAppointmentType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {!isLastStep ? (
                    <Button type="button" onClick={advanceStep}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending || updateAppointmentMutation.isPending
                        ? 'Saving...'
                        : appointment
                          ? 'Confirm Changes'
                          : 'Confirm Booking'}
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <aside className="space-y-4 rounded-3xl border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Live summary</p>
                <p className="text-sm text-muted-foreground">
                  The selected slot will be locked the moment the booking is confirmed.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Doctor</p>
                  <div className="mt-2 flex items-center gap-2">
                    <User2 className="h-4 w-4 text-primary" />
                    <p className="font-medium text-foreground">{currentSummary.doctor}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Visit</p>
                  <p className="mt-2 font-medium text-foreground">{currentSummary.type}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentSummary.date}</p>
                  <p className="text-sm text-muted-foreground">{currentSummary.time}</p>
                </div>

                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Availability cue</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDoctorSlots.map((slot) => (
                      <Badge
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'secondary'}
                        className={cn(
                          'rounded-full px-3 py-1',
                          selectedTime === slot && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {getSlotDisplayLabel(slot)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
