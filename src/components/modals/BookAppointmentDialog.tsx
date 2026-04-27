import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useDoctorsQuery, useCreateAppointmentMutation, useUpdateAppointmentMutation } from '@/hooks/useAppointments';
import { usePatientsQuery } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { formatAppointmentType, type Appointment, type AppointmentType } from '@/lib/domain';
import { APPOINTMENT_TIME_SLOTS, APPOINTMENT_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'doctor' | 'patient';
  appointment?: Appointment | null;
}
export const BookAppointmentDialog = ({ open, onOpenChange, role, appointment }: BookAppointmentDialogProps) => {
  const { profile } = useAuth();
  const [date, setDate] = useState<Date>();
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const { data: doctors = [] } = useDoctorsQuery();
  const { data: patients = [] } = usePatientsQuery(undefined, role === 'doctor');
  const createAppointmentMutation = useCreateAppointmentMutation(role);
  const updateAppointmentMutation = useUpdateAppointmentMutation(role);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!appointment) {
      setDate(undefined);
      setSelectedDoctor('');
      setSelectedPatient('');
      setSelectedTime('');
      setAppointmentType('');
      return;
    }

    const scheduled = new Date(appointment.scheduledAt);
    setDate(scheduled);
    setSelectedDoctor(appointment.doctorId);
    setSelectedPatient(appointment.patientId);
    setSelectedTime(scheduled.toISOString().slice(11, 16));
    setAppointmentType(appointment.appointmentType);
  }, [appointment, open]);

  const handleSubmit = async () => {
    if (!date || !selectedTime || !appointmentType || (role === 'patient' && !selectedDoctor) || (role === 'doctor' && !selectedPatient)) {
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
        toast.success('Appointment updated successfully.');
      } else {
        await createAppointmentMutation.mutateAsync({
          doctorId: role === 'patient' ? selectedDoctor : profile?.id ?? '',
          patientId: role === 'doctor' ? selectedPatient : profile?.id ?? '',
          scheduledAt,
          appointmentType: appointmentType as AppointmentType,
        });
        toast.success('Appointment booked successfully.');
      }
      onOpenChange(false);
      setDate(undefined);
      setSelectedDoctor('');
      setSelectedPatient('');
      setSelectedTime('');
      setAppointmentType('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save appointment.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment. Fill in all the required details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {role === 'patient' && (
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

          {role === 'doctor' && (
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

          <div className="space-y-2">
            <Label>Select Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
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
                  disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Select Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {appointment ? 'Save Changes' : 'Book Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
