import { Client, handle_file } from "@gradio/client";
import { env } from "@/lib/env";
import {
  findImageUrl,
  jsonToText,
  parseLandmarkDiagnosis,
  parseLandmarkMetric,
} from "@/lib/landmark";

export interface LandmarkResult {
  rawResponse: unknown;
  rawText: string;
  resultImageUrl: string | null;
  metrics: {
    sna: number | null;
    snb: number | null;
    anb: number | null;
  };
  diagnosis: string | null;
}

const getClient = async () => {
  if (!env.gradioSpaceUrl) {
    throw new Error("Missing VITE_GRADIO_SPACE_URL. Set it to your Hugging Face Space URL.");
  }

  return Client.connect(env.gradioSpaceUrl);
};

const toPlainObject = (value: unknown): unknown => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

/** Gradio/classifier may emit probabilities in [0,1], percents in (1,100], or a double-scaled value (e.g. 99.84×100). */
const toPercent = (raw: number): number => {
  if (!Number.isFinite(raw)) return 0;
  if (raw >= 0 && raw <= 1) return raw * 100;
  if (raw > 1 && raw <= 100) return raw;
  if (raw > 100 && raw <= 10_000) return raw / 100;
  return Math.min(100, raw);
};

const CEPHALOGRAM_LABELS_LC = new Set([
  "cephalogram x-ray",
  "valid cephalogram x-ray",
  "cephalogram",
]);

const isCephalogramClassLabel = (label: string) => {
  const n = normalizeModelLabel(label);
  if (!n) return false;
  if (CEPHALOGRAM_LABELS_LC.has(n)) return true;
  if (/^not\b/.test(n) || /\bnon[\s_-]?cephal\b/.test(n)) return false;
  if (
    /\bcephal(?:ogram)?\s*x-ray\b|\bcephal(?:ogram)?\s*x‑ray\b|\bcephalometric\b/.test(
      n.replace(/‑/g, "-")
    )
  )
    return true;
  return /\bcephalogram\b/.test(n);
};

const isRejectNonCephalogramLabel = (label: string) => {
  const n = normalizeModelLabel(label);
  return /\bnot\b.*(\bx[\s‑-]?ray\b|cephal|\bradiograph\b)|\bnon[\s_-]?cephal|\binvalid\b/.test(n);
};

/** Normalize label text so “Cephalogram X‑Ray” (unicode hyphen) still matches */
function normalizeModelLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[\u2011\u2010\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ");
}

/** Gradio 4+ wraps results as `{ type:'data', data: [...outputs] }` — not always a tuple */
function unwrapPredictOutputs(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: unknown[] }).data;
  }
  return [];
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

export const validateCephalogramXray = async (
  file: File,
  confidenceThreshold = 50
): Promise<{
  isCephalogram: boolean;
  /** Normalized cephalogram class score (%), highest matching label if multiple */
  confidence: number;
  topLabel: string;
  topConfidence: number;
  classifications: Record<string, number>;
}> => {
  try {
    if (!env.preModelUrl) {
      throw new Error("Pre-model URL not configured");
    }

    const client = await Client.connect(env.preModelUrl);

    const response = await client.predict("/predict", {
      image: handle_file(file),
    });

    // HF Space returns `{ type:'data', data: [ markdown, LabelData ], ... }` from @gradio/client
    interface ConfidenceItem {
      label?: string | number | null;
      confidence?: number | string | null;
    }

    interface ConfidenceData {
      label?: string | number | null;
      confidences?: ConfidenceItem[] | null;
    }

    const outputs = unwrapPredictOutputs(response);
    let confidenceData: ConfidenceData | null = null;

    if (outputs.length >= 2 && typeof outputs[1] === "object" && outputs[1] !== null) {
      confidenceData = outputs[1] as ConfidenceData;
    } else if (outputs.length === 1) {
      confidenceData = outputs[0] as ConfidenceData;
    } else if (typeof response === "object" && response !== null && "confidences" in response) {
      confidenceData = response as ConfidenceData;
    }

    const rawScores: Record<string, number> = {};

    if (confidenceData?.confidences && Array.isArray(confidenceData.confidences)) {
      for (const item of confidenceData.confidences) {
        const labRaw = item.label;
        const lab =
          typeof labRaw === "number"
            ? String(labRaw)
            : typeof labRaw === "string"
              ? labRaw
              : "";
        const n = lab.trim();
        if (!n) continue;
        const c = toFiniteNumber(item.confidence);
        if (c === undefined) continue;
        rawScores[n] = toPercent(c);
      }
    } else if (typeof confidenceData === "object" && confidenceData !== null) {
      const skip = new Set(["label", "confidences"]);
      for (const [k, v] of Object.entries(confidenceData)) {
        if (skip.has(k)) continue;
        const c = toFiniteNumber(v);
        if (c === undefined) continue;
        rawScores[k] = toPercent(c);
      }
    }

    const classifications: Record<string, number> = { ...rawScores };

    if (Object.keys(classifications).length === 0) {
      throw new Error(
        "Pre-model returned no classification scores. Update the app — or check Hugging Face /predict outputs."
      );
    }

    let topLabel = "";
    let topConfidence = 0;
    for (const [label, pct] of Object.entries(classifications)) {
      if (pct > topConfidence) {
        topConfidence = pct;
        topLabel = label;
      }
    }

    const apiPick =
      typeof confidenceData?.label === "string"
        ? confidenceData.label.trim()
        : confidenceData?.label != null &&
            String(confidenceData.label).trim() !== ""
          ? String(confidenceData.label).trim()
          : "";
    if (apiPick && classifications[apiPick] !== undefined && classifications[apiPick] >= topConfidence) {
      topLabel = apiPick;
      topConfidence = classifications[apiPick];
    }

    let cephalogramConfidence = 0;
    let notXRiskConfidence = 0;
    for (const [label, pct] of Object.entries(classifications)) {
      if (isCephalogramClassLabel(label)) cephalogramConfidence = Math.max(cephalogramConfidence, pct);
      if (isRejectNonCephalogramLabel(label)) notXRiskConfidence = Math.max(notXRiskConfidence, pct);
    }

    const isCephalogram =
      cephalogramConfidence >= confidenceThreshold && cephalogramConfidence > notXRiskConfidence;

    return {
      isCephalogram,
      confidence: cephalogramConfidence,
      topLabel,
      topConfidence,
      classifications,
    };
  } catch (error) {
    console.error("Pre-model validation error:", error);
    throw new Error(`Failed to validate X-ray: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeLandmarkXray = async (file: File): Promise<LandmarkResult> => {
  const client = await getClient();
  const response = await client.predict(env.gradioApiName, {
    image: handle_file(file),
  });

  // Handle both direct response and nested .data response
  interface ApiResponse {
    data?: unknown;
  }
  const responseObj = response as ApiResponse | unknown;
  const dataValue = typeof responseObj === 'object' && responseObj !== null && 'data' in responseObj ? (responseObj as ApiResponse).data : response;
  const payload = toPlainObject(dataValue);
  const rawText = jsonToText(payload);

  return {
    rawResponse: payload,
    rawText,
    resultImageUrl: findImageUrl(payload),
    metrics: {
      sna: parseLandmarkMetric(rawText, "SNA"),
      snb: parseLandmarkMetric(rawText, "SNB"),
      anb: parseLandmarkMetric(rawText, "ANB"),
    },
    diagnosis: parseLandmarkDiagnosis(rawText),
  };
};
