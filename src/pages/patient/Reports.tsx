import { useMemo, useState } from 'react';
import { Download, FileText, Share2, Filter, ArrowDownWideNarrow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { useCasesQuery } from '@/hooks/useCases';
import { useDoctorsQuery } from '@/hooks/useAppointments';
import { buildReportRows, getSlotDisplayLabel } from '@/lib/healthcare';
import { toast } from 'sonner';

const Reports = () => {
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const { data: cases = [] } = useCasesQuery('patient');
  const { data: doctors = [] } = useDoctorsQuery();

  const reportRows = useMemo(() => buildReportRows(cases), [cases]);

  const visibleReports = reportRows.filter((report) => {
    const matchesType = reportTypeFilter === 'all' || report.type === reportTypeFilter;
    const matchesDoctor = doctorFilter === 'all' || report.doctor === doctorFilter;
    return matchesType && matchesDoctor;
  });

  const handleDownload = (reportId?: string) => {
    const targetReports = reportId ? reportRows.filter((report) => report.id === reportId) : visibleReports;
    const payload = JSON.stringify(targetReports, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportId ? `report-${reportId}.json` : 'medical-reports.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(reportId ? 'Report downloaded.' : 'Reports downloaded.');
  };

  const handleShare = async (doctorName: string, reportTitle: string) => {
    const message = `Sharing ${reportTitle} with ${doctorName}.`;

    if (navigator.share) {
      await navigator.share({
        title: reportTitle,
        text: message,
      });
      return;
    }

    await navigator.clipboard.writeText(message);
    toast.success('Share text copied.');
  };

  const reportTypes = ['X-ray / Scan', 'Lab Report'];

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-primary/10 via-card to-secondary/10">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Filter className="h-3.5 w-3.5" />
                Reports
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Medical records and scans</h1>
              <p className="max-w-2xl text-muted-foreground">
                Filter by report type or doctor, then download or share the files you need.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={() => handleDownload()}>
                <Download className="h-4 w-4" />
                Download all
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <ArrowDownWideNarrow className="h-5 w-5 text-primary" />
                Filter reports
              </CardTitle>
              <CardDescription>Organize reports by date, type, and doctor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Report type</p>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {reportTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Doctor</p>
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All doctors</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.fullName}>
                        {doctor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Summary
              </CardTitle>
              <CardDescription>What’s currently on file.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Total reports</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{reportRows.length}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Visible now</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{visibleReports.length}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Active doctors</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{doctors.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {visibleReports.map((report) => (
            <Card key={report.id} className="border-border/60">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{report.title}</h3>
                    <Badge variant="secondary">{report.type}</Badge>
                    <Badge variant="outline">{report.doctor}</Badge>
                  </div>
                  <p className="max-w-2xl text-sm text-muted-foreground">{report.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => handleDownload(report.id)}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleShare(report.doctor, report.title)}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!visibleReports.length && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No reports match the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Quick slot reference: {getSlotDisplayLabel('09:00')} to {getSlotDisplayLabel('17:00')}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
