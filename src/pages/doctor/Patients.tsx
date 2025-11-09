import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { mockPatients } from '@/lib/mockData';
import { AddPatientDialog } from '@/components/modals/AddPatientDialog';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);

  const filteredPatients = mockPatients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                  </div>
                  <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                    {patient.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium text-foreground">{patient.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Visit:</span>
                    <span className="font-medium text-foreground">
                      {new Date(patient.lastVisit).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
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
