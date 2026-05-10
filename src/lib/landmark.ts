import type { Json } from "@/lib/database.types";

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => asText(item)).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.value === "string") return record.value;
    if (typeof record.label === "string") return record.label;
    if (typeof record.content === "string") return record.content;
    return Object.values(record).map((item) => asText(item)).filter(Boolean).join("\n");
  }
  return "";
};

export const jsonToText = (value: Json | unknown): string => asText(value);

export const findImageUrl = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("blob:") ||
      lower.startsWith("data:image/") ||
      /\.(png|jpg|jpeg|webp|gif)$/i.test(lower)
    ) {
      return value;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "path", "image", "image_url", "src"]) {
      const found = findImageUrl(record[key]);
      if (found) return found;
    }
  }

  return null;
};

export const parseLandmarkMetric = (text: string, label: "SNA" | "SNB" | "ANB") => {
  const match = text.match(new RegExp(`${label}\\s*:\\s*([-+]?[0-9]*\\.?[0-9]+)`, "i"));
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseLandmarkDiagnosis = (text: string) => {
  const match = text.match(/Diagnosis\s*:\s*(.+)/i);
  return match?.[1]?.replace(/\s+\b(?:true|false)\b\s*$/i, '').trim() ?? null;
};
