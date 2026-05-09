import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATA_IMAGE_PATTERN = /\bdata:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.|blob:)\S+/gi;
const GRADIO_TEMP_PATH_PATTERN =
  /(?:\/tmp\/gradio\/[^\s,;)"'\]}]+|[a-z]:\\(?:[^\\\s]+\\)*gradio\\[^\s,;)"'\]}]+)/gim;
const GRADIO_FILEDATA_PATTERN = /\bgradio\.filedata\b/gi;
const GRADIO_HASH_PATTERN = /\b[0-9a-f]{24,}(?:\/[a-z0-9._-]+)?\b/gi;
const IMAGE_FILE_NAME_PATTERN = /\b[a-z0-9_-]+\.(?:webp|png|jpe?g|gif|bmp|tiff?)\b/gi;

export const sanitizeVisibleText = (value: string | null | undefined) =>
  (value ?? "")
    .replace(DATA_IMAGE_PATTERN, "")
    .replace(URL_PATTERN, "")
    .replace(GRADIO_FILEDATA_PATTERN, "")
    .replace(GRADIO_TEMP_PATH_PATTERN, " ")
    .replace(GRADIO_HASH_PATTERN, "")
    .replace(IMAGE_FILE_NAME_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
