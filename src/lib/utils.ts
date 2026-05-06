import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATA_IMAGE_PATTERN = /\bdata:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.|blob:)\S+/gi;

export const sanitizeVisibleText = (value: string | null | undefined) =>
  (value ?? "")
    .replace(DATA_IMAGE_PATTERN, "")
    .replace(URL_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
