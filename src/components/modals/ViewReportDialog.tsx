import { Download, FileText, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { CaseRecord } from '@/lib/domain';
import { buildCaseReportPdf } from '@/lib/reportPdf';
import { downloadPdf } from '@/lib/pdf';

interface ViewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: CaseRecord | null;
}

export const ViewReportDialog = ({ open, onOpenChange, caseData }: ViewReportDialogProps) => {
  if (!caseData) return null;

  const handleDownloadReport = () => {
    downloadPdf(buildCaseReportPdf(caseData), `case-${caseData.id}.pdf`);
    toast.success('Report downloaded as PDF.');
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Case Report #{caseData.id}</DialogTitle>
              <DialogDescription className="mt-1">
                Detailed analysis and treatment recommendations
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(caseData.status)}>
              {caseData.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Info */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              Patient Information
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Patient Name</p>
                <p className="font-medium text-foreground">{caseData.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upload Date</p>
                <p className="font-medium text-foreground">
                  {new Date(caseData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {caseData.analysis ? (
            <>
              <Separator />

              {/* Analysis Metrics */}
              <div>
                <h3 className="mb-4 font-semibold text-foreground">Analysis Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Misalignment Score</span>
                      <span className="font-medium text-foreground">{caseData.analysis.metrics.misalignment ?? 0}%</span>
                    </div>
                    <Progress value={caseData.analysis.metrics.misalignment ?? 0} className="h-2" />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Symmetry Score</span>
                      <span className="font-medium text-foreground">{caseData.analysis.metrics.symmetry ?? 0}%</span>
                    </div>
                    <Progress value={caseData.analysis.metrics.symmetry ?? 0} className="h-2" />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Crowding Score</span>
                      <span className="font-medium text-foreground">{caseData.analysis.metrics.crowding ?? 0}%</span>
                    </div>
                    <Progress value={caseData.analysis.metrics.crowding ?? 0} className="h-2" />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Overbite Score</span>
                      <span className="font-medium text-foreground">{caseData.analysis.metrics.overbite ?? 0}%</span>
                    </div>
                    <Progress value={caseData.analysis.metrics.overbite ?? 0} className="h-2" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recommendation */}
              <div className="rounded-lg bg-primary/5 p-4">
                <h3 className="mb-2 font-semibold text-foreground">Recommended Treatment</h3>
                <p className="text-lg font-medium text-primary">
                  {caseData.bracePreference?.braceOptionName ?? caseData.analysis.summary ?? 'Pending recommendation'}
                </p>
              </div>

              {/* Notes */}
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Clinical Notes</h3>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-foreground">{caseData.analysis.notes ?? 'No notes provided.'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-muted p-8 text-center">
              <FileText className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Analysis pending...</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          {caseData.analysis && (
            <Button onClick={handleDownloadReport} className="w-full gap-2 sm:w-auto">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
