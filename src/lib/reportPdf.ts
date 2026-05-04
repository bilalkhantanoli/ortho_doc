import type { CaseRecord } from '@/lib/domain';
import type { PdfDocumentInput, PdfSection } from '@/lib/pdf';
import type { ReportRow } from '@/lib/healthcare';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const metricValue = (value: number | null | undefined) =>
  typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A';

const buildCaseSections = (caseData: CaseRecord): PdfSection[] => {
  const analysis = caseData.analysis;

  if (!analysis) {
    return [
      {
        title: 'Analysis Status',
        paragraphs: ['This case has not completed analysis yet.'],
      },
    ];
  }

  return [
    {
      title: 'Analysis Summary',
      paragraphs: [
        analysis.summary ?? 'No summary available.',
        analysis.notes ?? 'No clinical notes were provided.',
      ],
    },
    {
      title: 'Key Metrics',
      fields: [
        { label: 'Misalignment', value: metricValue(analysis.metrics.misalignment) },
        { label: 'Symmetry', value: metricValue(analysis.metrics.symmetry) },
        { label: 'Crowding', value: metricValue(analysis.metrics.crowding) },
        { label: 'Overbite', value: metricValue(analysis.metrics.overbite) },
        { label: 'Confidence', value: metricValue(analysis.metrics.confidence) },
      ],
    },
    {
      title: 'Recommendation',
      paragraphs: [
        caseData.bracePreference?.braceOptionName ??
          analysis.summary ??
          'Pending recommendation.',
      ],
    },
  ];
};

export const buildCaseReportPdf = (caseData: CaseRecord): PdfDocumentInput => ({
  title: `Case Report #${caseData.id}`,
  subtitle: 'Generated clinical summary',
  meta: [
    { label: 'Patient', value: caseData.patientName },
    { label: 'Doctor', value: caseData.doctorName ?? 'Assigned doctor' },
    { label: 'Status', value: caseData.status },
    { label: 'Upload Date', value: formatDate(caseData.createdAt) },
  ],
  sections: buildCaseSections(caseData),
  footer: 'OrthoDoc AI case report export',
});

export const buildMedicalReportsPdf = (
  reports: ReportRow[],
  filters: { reportType: string; doctor: string },
): PdfDocumentInput => ({
  title: 'Medical Reports',
  subtitle: 'Patient report archive',
  meta: [
    { label: 'Total reports', value: String(reports.length) },
    { label: 'Report type filter', value: filters.reportType },
    { label: 'Doctor filter', value: filters.doctor },
  ],
  sections: reports.map((report) => ({
    title: report.title,
    fields: [
      { label: 'Type', value: report.type },
      { label: 'Doctor', value: report.doctor },
      { label: 'Date', value: formatDate(report.date) },
    ],
    paragraphs: [report.summary],
  })),
  footer: 'OrthoDoc AI medical reports export',
});
