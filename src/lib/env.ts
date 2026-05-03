const requiredEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  supabaseUrl: requiredEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
  supabaseAnonKey: requiredEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, "VITE_SUPABASE_ANON_KEY"),
  gradioSpaceUrl: import.meta.env.VITE_GRADIO_SPACE_URL ?? "",
  gradioApiName: import.meta.env.VITE_GRADIO_API_NAME ?? "/predict_landmarks",
};
