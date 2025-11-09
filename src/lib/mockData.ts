export interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  lastVisit: string;
  status: 'active' | 'inactive';
}

export interface Case {
  id: string;
  patientId: string;
  patientName: string;
  uploadDate: string;
  status: 'pending' | 'analyzed' | 'approved';
  analysis?: AnalysisResult;
}

export interface AnalysisResult {
  misalignment: number;
  symmetry: number;
  crowding: number;
  overbite: number;
  recommendedBrace: string;
  notes: string;
  imageUrl: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export const mockPatients: Patient[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', age: 28, lastVisit: '2024-11-01', status: 'active' },
  { id: '2', name: 'Michael Chen', email: 'mchen@email.com', age: 35, lastVisit: '2024-10-28', status: 'active' },
  { id: '3', name: 'Emma Wilson', email: 'emma.w@email.com', age: 22, lastVisit: '2024-10-15', status: 'inactive' },
  { id: '4', name: 'David Brown', email: 'd.brown@email.com', age: 31, lastVisit: '2024-11-05', status: 'active' },
];

export const mockCases: Case[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Sarah Johnson',
    uploadDate: '2024-11-01',
    status: 'analyzed',
    analysis: {
      misalignment: 42,
      symmetry: 85,
      crowding: 38,
      overbite: 25,
      recommendedBrace: 'Invisible Aligner',
      notes: 'Mild crowding detected in upper arch. Recommend clear aligners for 12-18 months.',
      imageUrl: '/placeholder.svg',
    },
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Michael Chen',
    uploadDate: '2024-10-28',
    status: 'approved',
  },
  {
    id: '3',
    patientId: '4',
    patientName: 'David Brown',
    uploadDate: '2024-11-05',
    status: 'pending',
  },
];

export const mockAppointments: Appointment[] = [
  { id: '1', patientName: 'Sarah Johnson', doctorName: 'Dr. Smith', date: '2024-11-15', time: '10:00 AM', type: 'Follow-up', status: 'scheduled' },
  { id: '2', patientName: 'Michael Chen', doctorName: 'Dr. Smith', date: '2024-11-16', time: '2:00 PM', type: 'Consultation', status: 'scheduled' },
  { id: '3', patientName: 'Emma Wilson', doctorName: 'Dr. Smith', date: '2024-11-10', time: '9:00 AM', type: 'Check-up', status: 'completed' },
];

export const braceOptions = [
  { id: 'metal', name: 'Metal Braces', color: '#C0C0C0', description: 'Traditional and reliable' },
  { id: 'ceramic', name: 'Ceramic Braces', color: '#F5F5DC', description: 'Tooth-colored, less visible' },
  { id: 'clear', name: 'Clear Aligners', color: 'transparent', description: 'Nearly invisible, removable' },
  { id: 'lingual', name: 'Lingual Braces', color: '#D4AF37', description: 'Behind the teeth' },
];

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    misalignment: Math.floor(Math.random() * 60) + 20,
    symmetry: Math.floor(Math.random() * 30) + 70,
    crowding: Math.floor(Math.random() * 50) + 10,
    overbite: Math.floor(Math.random() * 40) + 10,
    recommendedBrace: braceOptions[Math.floor(Math.random() * braceOptions.length)].name,
    notes: 'AI analysis complete. Consultation recommended for detailed treatment plan.',
    imageUrl: URL.createObjectURL(file),
  };
}
