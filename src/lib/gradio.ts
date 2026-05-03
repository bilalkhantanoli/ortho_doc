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

export const analyzeLandmarkXray = async (file: File): Promise<LandmarkResult> => {
  const client = await getClient();
  const response = await client.predict(env.gradioApiName, {
    image: handle_file(file),
  });

  const payload = toPlainObject((response as any)?.data ?? response);
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
