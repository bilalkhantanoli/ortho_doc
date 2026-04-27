import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useBraceOptionsQuery, useBracePreferenceQuery, useDeleteBracePreferenceMutation, useSaveBracePreferenceMutation } from '@/hooks/useBraces';
import { useCaseDetailQuery } from '@/hooks/useCases';
import { BRACE_COLORS } from '@/lib/constants';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface CustomizeProps {
  role: 'doctor' | 'patient';
}

const Customize = ({ role }: CustomizeProps) => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const { data: caseRecord } = useCaseDetailQuery(caseId);
  const { data: options = [] } = useBraceOptionsQuery();
  const { data: preference } = useBracePreferenceQuery(caseId);
  const savePreferenceMutation = useSaveBracePreferenceMutation(caseId ?? '');
  const deletePreferenceMutation = useDeleteBracePreferenceMutation(caseId ?? '');
  const [selectedBrace, setSelectedBrace] = useState('');
  const [selectedColor, setSelectedColor] = useState(BRACE_COLORS[0].value);

  useEffect(() => {
    if (preference) {
      setSelectedBrace(preference.braceOptionId);
      setSelectedColor(preference.colorHex);
    } else if (options[0]) {
      setSelectedBrace(options[0].id);
      setSelectedColor(options[0].defaultColorHex ?? BRACE_COLORS[0].value);
    }
  }, [preference, options]);

  const handleSave = async () => {
    if (!caseId || !caseRecord) {
      return;
    }

    try {
      await savePreferenceMutation.mutateAsync({
        caseId,
        patientId: caseRecord.patientId,
        braceOptionId: selectedBrace,
        colorHex: selectedColor,
      });
      const selected = options.find((item) => item.id === selectedBrace);
      toast.success(
        `Saved ${selected?.name ?? 'brace selection'} in ${
          BRACE_COLORS.find((color) => color.value === selectedColor)?.name ?? selectedColor
        }.`,
      );
      navigate(`/${role}/analysis-result/${caseId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save your brace preference.'));
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customize Brace</h1>
          <p className="text-muted-foreground">Choose your preferred style and color</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Brace Type Selection */}
          <Card>
            <CardHeader>
            <CardTitle>Brace Type</CardTitle>
            <CardDescription>Select your preferred brace style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
              {options.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedBrace(option.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedBrace === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedBrace === option.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>

          {/* Color Selection */}
          <Card>
            <CardHeader>
            <CardTitle>Color Options</CardTitle>
            <CardDescription>Pick your favorite color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {BRACE_COLORS.map((color) => (
                  <motion.button
                    key={color.value}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(color.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                      selectedColor === color.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="h-12 w-12 rounded-full ring-2 ring-border ring-offset-2"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm font-medium text-foreground">{color.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-6">
                <p className="mb-4 text-sm font-medium text-muted-foreground">Preview</p>
                <div className="flex items-center justify-center rounded-lg bg-background p-8">
                  <div className="relative">
                    <div className="h-24 w-32 rounded-lg bg-gradient-to-b from-muted to-muted-foreground/20" />
                    <div
                      className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-semibold text-foreground">
                {options.find((b) => b.id === selectedBrace)?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Color: {BRACE_COLORS.find((c) => c.value === selectedColor)?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                <Palette className="h-4 w-4" />
                Save Selection
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!caseId) {
                    return;
                  }
                  try {
                    await deletePreferenceMutation.mutateAsync();
                    toast.success('Brace preference reset.');
                  } catch (error) {
                    toast.error(getErrorMessage(error, 'Unable to reset the preference.'));
                  }
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Customize;
