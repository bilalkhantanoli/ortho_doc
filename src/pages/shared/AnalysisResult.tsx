import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Palette, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { AnalysisResult as AnalysisResultType } from '@/lib/mockData';
import { toast } from 'sonner';

interface AnalysisResultProps {
  role: 'doctor' | 'patient';
}

const AnalysisResult = ({ role }: AnalysisResultProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [analysis, setAnalysis] = useState<AnalysisResultType | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('latestAnalysis');
    if (stored) {
      setAnalysis(JSON.parse(stored));
    } else {
      navigate(`/${role}/upload`);
    }
  }, [navigate, role]);

  if (!analysis) return null;

  const metrics = [
    { label: 'Misalignment', value: analysis.misalignment, max: 100, color: 'bg-destructive' },
    { label: 'Symmetry', value: analysis.symmetry, max: 100, color: 'bg-success' },
    { label: 'Crowding', value: analysis.crowding, max: 100, color: 'bg-primary' },
    { label: 'Overbite', value: analysis.overbite, max: 100, color: 'bg-secondary' },
  ];

  const handleDownload = () => {
    toast.success('Report downloaded successfully!');
  };

  const handleApprove = () => {
    toast.success('Analysis approved!');
    navigate(`/${role}/dashboard`);
  };

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
            <p className="text-muted-foreground">AI-powered orthodontic assessment</p>
          </div>
        </div>

        {/* Image Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={analysis.imageUrl}
              alt="Dental scan"
              className="w-full rounded-lg object-contain"
            />
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <span className="text-muted-foreground">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </motion.div>
            ))}
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
              <p className="font-semibold text-foreground">{analysis.recommendedBrace}</p>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.notes}</p>
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
            onClick={() => navigate(`/${role}/customize`)}
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
