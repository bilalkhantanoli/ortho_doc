import { STORAGE_BUCKETS } from "@/lib/constants";
import { supabase } from "@/lib/supabase/client";

export const buildCaseImagePath = (userId: string, fileName: string) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]+/g, "-").toLowerCase();
  return `${userId}/${crypto.randomUUID()}-${safeName}`;
};

export const createSignedImageUrl = async (path: string, expiresIn = 60 * 60) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.caseImages)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
};

export const removeStoredImage = async (path: string) => {
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.caseImages).remove([path]);

  if (error) {
    throw error;
  }
};
