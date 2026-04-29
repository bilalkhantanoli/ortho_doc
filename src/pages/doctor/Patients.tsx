import { useEffect, useState } from 'react';
import { Search, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { AddPatientDialog } from '@/components/modals/AddPatientDialog';
import { useDeletePatientMutation, usePatientsQuery, useUpdatePatientStatusMutation } from '@/hooks/usePatients';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
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

const Patients = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string } | null>(null);
  const { data: patients = [], isLoading } = usePatientsQuery(searchTerm, true);
  const updateStatusMutation = useUpdatePatientStatusMutation();
  const deletePatientMutation = useDeletePatientMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Patients</h1>
            <p className="text-muted-foreground">Manage your patient records</p>
          </div>
          <Button className="gap-2" type="button" onClick={() => setShowAddPatientDialog(true)}>
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                  <Badge variant={patient.relationshipStatus === 'active' ? 'default' : 'secondary'}>
                    {patient.relationshipStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium text-foreground">{patient.age ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linked Cases:</span>
                    <span className="font-medium text-foreground">{patient.activeCaseCount}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    type="button"
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({
                          relationshipId: patient.relationshipId,
                          relationshipStatus: patient.relationshipStatus === 'active' ? 'inactive' : 'active',
                        });
                        toast.success('Patient status updated.');
                      } catch (error) {
                        toast.error(getErrorMessage(error, 'Unable to update patient.'));
                      }
                    }}
                  >
                    {patient.relationshipStatus === 'active' ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setPatientToDelete({ id: patient.relationshipId, name: patient.fullName })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoading && patients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No patients found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddPatientDialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog} />

      <AlertDialog
        open={Boolean(patientToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPatientToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {patientToDelete?.name ?? 'this patient'} from your patient list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPatientToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!patientToDelete) return;

                try {
                  await deletePatientMutation.mutateAsync(patientToDelete.id);
                  toast.success('Patient removed from your list.');
                } catch (error) {
                  toast.error(getErrorMessage(error, 'Unable to remove patient.'));
                } finally {
                  setPatientToDelete(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Patients;
