import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { mockCases, type Case } from '@/lib/mockData';
import { ViewReportDialog } from '@/components/modals/ViewReportDialog';

const Cases = () => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

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

  const handleViewReport = (caseItem: Case) => {
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
          {mockCases.map((caseItem) => (
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
                        {new Date(caseItem.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    {caseItem.analysis && (
                      <div>
                        <span className="text-muted-foreground">Recommendation:</span>
                        <p className="font-medium text-foreground">
                          {caseItem.analysis.recommendedBrace}
                        </p>
                      </div>
                    )}
                  </div>

                  {caseItem.analysis && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm text-muted-foreground">{caseItem.analysis.notes}</p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => handleViewReport(caseItem)}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockCases.length === 0 && (
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
