import { useState } from 'react';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { ViewReportDialog } from '@/components/modals/ViewReportDialog';
import { useCasesQuery, useDeleteCaseMutation } from '@/hooks/useCases';
import type { CaseRecord } from '@/lib/domain';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { sanitizeVisibleText } from '@/lib/utils';

const Cases = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { data: cases = [], isLoading } = useCasesQuery('patient');
  const deleteCaseMutation = useDeleteCaseMutation('patient');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'analyzed':
        return 'bg-primary/10 text-primary';
      case 'approved':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewReport = (caseItem: CaseRecord) => {
    setSelectedCase(caseItem);
    setShowReportDialog(true);
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Cases</h1>
          <p className="text-muted-foreground">View your analysis history</p>
        </div>

        <div className="grid gap-4">
          {cases.map((caseItem) => {
            const sanitizedSummary = sanitizeVisibleText(caseItem.analysis?.summary);
            const sanitizedRecommendation =
              sanitizeVisibleText(caseItem.bracePreference?.braceOptionName) || sanitizedSummary;
            const sanitizedNotes = sanitizeVisibleText(caseItem.analysis?.notes);

            return (
            <Card key={caseItem.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Case #{caseItem.id}</CardTitle>
                  <Badge className={getStatusColor(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Upload Date:</span>
                      <p className="font-medium text-foreground">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {sanitizedRecommendation && (
                      <div>
                        <span className="text-muted-foreground">Recommendation:</span>
                        <p className="font-medium text-foreground">
                          {sanitizedRecommendation || 'Pending recommendation'}
                        </p>
                      </div>
                    )}
                  </div>

                  {sanitizedNotes && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm text-muted-foreground">{sanitizedNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() => navigate(`/patient/analysis-result/${caseItem.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Open Case
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={async () => {
                        try {
                          await deleteCaseMutation.mutateAsync({
                            caseId: caseItem.id,
                            imagePath: caseItem.imagePath,
                          });
                          toast.success('Case deleted.');
                        } catch (error) {
                          toast.error(getErrorMessage(error, 'Unable to delete case.'));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() => handleViewReport(caseItem)}
                    >
                      Quick View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {!isLoading && cases.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No cases found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ViewReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        caseData={selectedCase}
      />
    </DashboardLayout>
  );
};

export default Cases;
