import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCaseMutation } from '@/hooks/useCases';
import { useDoctorsQuery } from '@/hooks/useAppointments';
import { usePatientsQuery } from '@/hooks/usePatients';
import { validateCephalogramXray } from '@/lib/gradio';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface UploadProps {
  role: 'doctor' | 'patient';
}

const Upload = ({ role }: UploadProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const createCaseMutation = useCreateCaseMutation(role);
  const { data: patients = [] } = usePatientsQuery(undefined, role === 'doctor');
  const { data: doctors = [] } = useDoctorsQuery();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        toast.error('Please select an image file');
      }
    }
  }, []);

  const handleUpload = async () => {
    if (!file || !profile) return;
    const resolvedPatientId = role === 'doctor' ? patientId : profile.id;

    if (!title.trim()) {
      toast.error('Please add a case title.');
      return;
    }

    if (!resolvedPatientId) {
      toast.error('Please select a patient.');
      return;
    }

    if (role === 'patient' && !doctorId) {
      toast.error('Please select a doctor for review.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      setProgress(20);
      let validation;
      try {
        validation = await validateCephalogramXray(file, 50);
      } catch (validationError) {
        clearInterval(progressInterval);
        toast.error(
          validationError instanceof Error ? validationError.message : 'Validation service unavailable'
        );
        setIsAnalyzing(false);
        setProgress(0);
        return;
      }

      if (!validation.isCephalogram) {
        clearInterval(progressInterval);
        const label = validation.topLabel || 'unknown';
        toast.error(
          `This image is not a cephalogram X-ray (model predicts "${label}" at ${validation.topConfidence.toFixed(1)}%). ` +
            `Please upload a lateral cephalometric radiograph.`
        );
        setIsAnalyzing(false);
        setProgress(0);
        return;
      }

      setProgress(40);

      const caseId = await createCaseMutation.mutateAsync({
        file,
        title: title.trim(),
        patientId: resolvedPatientId,
        doctorId: role === 'doctor' ? profile.id : doctorId || null,
      });
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        toast.success('Image uploaded. Analysis is running.');
        navigate(`/${role}/analysis-result/${caseId}`);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      toast.error(getErrorMessage(error, 'Analysis failed. Please try again.'));
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Image</h1>
          <p className="text-muted-foreground">Upload a dental photo for AI analysis</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>
              Upload a clear photo of the teeth for accurate analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="case-title">Case Title</Label>
                <Input
                  id="case-title"
                  placeholder="Initial upper arch scan"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              {role === 'doctor' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Select Patient</Label>
                  <Select value={patientId} onValueChange={setPatientId} disabled={isAnalyzing}>
                    <SelectTrigger>
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

              {role === 'patient' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Select Doctor</Label>
                  <Select value={doctorId} onValueChange={setDoctorId} disabled={isAnalyzing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor for review" />
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
            </div>

            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 transition-colors hover:bg-muted/30"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or JPEG (MAX. 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Progress */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                    {progress < 100 ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {progress < 100 ? 'Uploading and dispatching analysis...' : 'Analysis queued'}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full bg-gradient-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Analyze Image
                  </>
                )}
              </Button>
              {file && !isAnalyzing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setTitle('');
                    if (role === 'doctor') {
                      setPatientId('');
                    }
                    if (role === 'patient') {
                      setDoctorId('');
                    }
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
