import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenIcId(id: string, keepIndices: number[] = [0, 3, -1]): string {
  if (typeof id !== "string") throw new Error("id must be a string");

  const parts = id.split("-");
  if (parts.length < 3) return id;

  const validPart = /^[a-z2-7]+$/;
  if (!parts.every(p => validPart.test(p))) {
    return parts.filter(Boolean).join("-");
  }

  const resolved = keepIndices
    .map(i => (i < 0 ? parts.length + i : i))
    .filter(i => i >= 0 && i < parts.length);

  const seen = new Set<number>();
  const chosen = resolved.filter(i => (seen.has(i) ? false : (seen.add(i), true)));

  return chosen.map(i => parts[i]).join("-");
}