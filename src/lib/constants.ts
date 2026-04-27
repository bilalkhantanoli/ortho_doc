export const STORAGE_BUCKETS = {
  caseImages: "case-images",
} as const;

export const QUERY_KEYS = {
  auth: ["auth"] as const,
  profile: ["profile"] as const,
  doctors: ["doctors"] as const,
  dashboard: (role: "doctor" | "patient") => ["dashboard", role] as const,
  patients: ["patients"] as const,
  appointments: (role: "doctor" | "patient") => ["appointments", role] as const,
  cases: (role: "doctor" | "patient") => ["cases", role] as const,
  caseDetail: (caseId: string) => ["case", caseId] as const,
  braceOptions: ["brace-options"] as const,
  bracePreference: (caseId: string) => ["brace-preference", caseId] as const,
};

export const APPOINTMENT_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export const APPOINTMENT_TYPES = [
  "consultation",
  "follow_up",
  "check_up",
  "treatment",
  "emergency",
] as const;

export const BRACE_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
