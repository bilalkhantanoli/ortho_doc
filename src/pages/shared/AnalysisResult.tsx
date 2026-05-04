import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Palette, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { useCaseDetailQuery, useApproveCaseMutation } from '@/hooks/useCases';
import { findImageUrl, jsonToText, parseLandmarkDiagnosis } from '@/lib/landmark';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { buildCaseReportPdf } from '@/lib/reportPdf';
import { downloadPdf } from '@/lib/pdf';

interface AnalysisResultProps {
  role: 'doctor' | 'patient';
}

const AnalysisResult = ({ role }: AnalysisResultProps) => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const { data: caseRecord, isLoading } = useCaseDetailQuery(caseId);
  const approveCaseMutation = useApproveCaseMutation(role);

  const metrics = useMemo(
    () =>
      caseRecord?.analysis
        ? [
            {
              label: 'SNA',
              value: caseRecord.analysis.metrics.sna ?? caseRecord.analysis.metrics.misalignment ?? 0,
            },
            {
              label: 'SNB',
              value: caseRecord.analysis.metrics.snb ?? caseRecord.analysis.metrics.symmetry ?? 0,
            },
            {
              label: 'ANB',
              value: caseRecord.analysis.metrics.anb ?? caseRecord.analysis.metrics.crowding ?? 0,
            },
            {
              label: 'Confidence',
              value: caseRecord.analysis.metrics.confidence ?? caseRecord.analysis.metrics.overbite ?? 0,
            },
          ]
        : [],
    [caseRecord],
  );

  const rawAnalysisText = useMemo(
    () => jsonToText(caseRecord?.analysis?.rawResponse ?? caseRecord?.analysis?.notes ?? ''),
    [caseRecord],
  );

  const diagnosis = useMemo(
    () => parseLandmarkDiagnosis(rawAnalysisText) ?? caseRecord?.analysis?.summary ?? null,
    [caseRecord, rawAnalysisText],
  );

  const annotatedImageUrl = useMemo(
    () => caseRecord?.analysis?.resultImageUrl ?? findImageUrl(caseRecord?.analysis?.rawResponse),
    [caseRecord],
  );

  const handleDownload = () => {
    if (!caseRecord) {
      return;
    }

    downloadPdf(buildCaseReportPdf(caseRecord), `case-${caseRecord.id}.pdf`);
    toast.success('Report downloaded as PDF.');
  };

  const handleApprove = async () => {
    if (!caseRecord) {
      return;
    }

    try {
      await approveCaseMutation.mutateAsync(caseRecord.id);
      toast.success('Analysis approved.');
      navigate(`/${role}/dashboard`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to approve the case.'));
    }
  };

  if (isLoading || !caseRecord) {
    return (
      <DashboardLayout role={role}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/${role}/upload`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis Complete</h1>
            <p className="text-muted-foreground">{caseRecord.title}</p>
          </div>
        </div>

        {/* Image Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Image</CardTitle>
          </CardHeader>
          <CardContent>
            {caseRecord.imageUrl ? (
              <img
                src={caseRecord.imageUrl}
                alt="Dental scan"
                className="w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Image preview unavailable.</p>
            )}
          </CardContent>
        </Card>

        {annotatedImageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Gradio Result Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={annotatedImageUrl}
                alt="Gradio analysis result"
                className="w-full rounded-lg object-contain"
              />
            </CardContent>
          </Card>
        )}

        {caseRecord.status === 'processing' && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="flex items-center gap-3 p-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                The AI model is still processing this case. This screen refreshes automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {caseRecord.status === 'failed' && (
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {caseRecord.analysis?.failureReason ?? 'The analysis failed before a complete response was stored.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Landmark Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!caseRecord.analysis && (
              <p className="text-sm text-muted-foreground">No completed analysis is available yet.</p>
            )}
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{metric.label}</span>
                  <span className="text-muted-foreground">{metric.value.toFixed(2)}</span>
                </div>
                <Progress value={Math.max(0, Math.min(metric.value, 100))} className="h-2" />
              </motion.div>
            ))}

            {diagnosis && (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Diagnosis</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{diagnosis}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">
                {caseRecord.bracePreference?.braceOptionName ?? diagnosis ?? caseRecord.analysis?.summary ?? 'Pending recommendation'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {rawAnalysisText || 'Once the AI response completes, clinical notes will appear here.'}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {role === 'doctor' && (
            <Button onClick={handleApprove} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approve Plan
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/${role}/customize/${caseRecord.id}`)}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            Customize Brace
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalysisResult;
