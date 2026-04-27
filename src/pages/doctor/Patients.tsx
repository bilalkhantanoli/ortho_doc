import { useState } from 'react';
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

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const { data: patients = [], isLoading } = usePatientsQuery(searchTerm, true);
  const updateStatusMutation = useUpdatePatientStatusMutation();
  const deletePatientMutation = useDeletePatientMutation();

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Patients</h1>
            <p className="text-muted-foreground">Manage your patient records</p>
          </div>
          <Button className="gap-2" onClick={() => setShowAddPatientDialog(true)}>
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients Grid */}
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
                    <span className="font-medium text-foreground">
                      {patient.activeCaseCount}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
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
                    onClick={async () => {
                      try {
                        await deletePatientMutation.mutateAsync(patient.relationshipId);
                        toast.success('Patient removed from your list.');
                      } catch (error) {
                        toast.error(getErrorMessage(error, 'Unable to remove patient.'));
                      }
                    }}
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

      {/* Modals */}
      <AddPatientDialog
        open={showAddPatientDialog}
        onOpenChange={setShowAddPatientDialog}
      />
    </DashboardLayout>
  );
};

export default Patients;
