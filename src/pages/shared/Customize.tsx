import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { braceOptions } from '@/lib/mockData';
import { toast } from 'sonner';

interface CustomizeProps {
  role: 'doctor' | 'patient';
}

const Customize = ({ role }: CustomizeProps) => {
  const [selectedBrace, setSelectedBrace] = useState(braceOptions[0].id);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
  ];

  const handleSave = () => {
    const selected = braceOptions.find((b) => b.id === selectedBrace);
    toast.success(`Saved! ${selected?.name} in ${colors.find((c) => c.value === selectedColor)?.name}`);
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
              {braceOptions.map((option) => (
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
                {colors.map((color) => (
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
                {braceOptions.find((b) => b.id === selectedBrace)?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Color: {colors.find((c) => c.value === selectedColor)?.name}
              </p>
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Palette className="h-4 w-4" />
              Save Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Customize;
