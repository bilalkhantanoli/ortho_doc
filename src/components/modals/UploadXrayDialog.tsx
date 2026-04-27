import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDoctorsQuery } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCaseMutation } from '@/hooks/useCases';
import { usePatientsQuery } from '@/hooks/usePatients';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface UploadXrayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'doctor' | 'patient';
}

export const UploadXrayDialog = ({ open, onOpenChange, role }: UploadXrayDialogProps) => {
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
      toast.error('Please enter a case title.');
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
        onOpenChange(false);
        navigate(`/${role}/analysis-result/${caseId}`);
        
        // Reset state
        setFile(null);
        setPreview(null);
        setIsAnalyzing(false);
        setProgress(0);
        setTitle('');
        setPatientId('');
        setDoctorId('');
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      toast.error(getErrorMessage(error, 'Analysis failed. Please try again.'));
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setTitle('');
    setPatientId('');
    setDoctorId('');
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      handleClear();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload X-ray Image</DialogTitle>
          <DialogDescription>
            Upload a clear dental X-ray or photo for AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-case-title">Case Title</Label>
            <Input
              id="dialog-case-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Consultation X-ray"
              disabled={isAnalyzing}
            />
          </div>

          {role === 'doctor' && (
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          {/* Upload Area */}
          <div className="relative">
            <input
              type="file"
              id="xray-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            <label
              htmlFor="xray-upload"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 transition-colors hover:bg-muted/30 ${
                isAnalyzing ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {preview ? (
                <div className="relative w-full">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 w-full rounded-lg object-contain"
                  />
                  {!isAnalyzing && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleClear();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
                className="overflow-hidden"
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
              variant="outline"
              onClick={handleClose}
              disabled={isAnalyzing}
              className="flex-1"
            >
              Cancel
            </Button>
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
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
