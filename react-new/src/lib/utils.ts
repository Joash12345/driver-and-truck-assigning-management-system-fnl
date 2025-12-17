import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLicense(input: string) {
  if (!input) return "";
  // allow only digits and limit to 12 digits: XXXX-XXX-XXXXX
  const raw = String(input).replace(/\D/g, "").slice(0, 12);
  const p1 = raw.slice(0, 4);
  const p2 = raw.slice(4, 7);
  const p3 = raw.slice(7, 12);
  return [p1, p2, p3].filter(Boolean).join("-");
}

export function extractPhoneSuffix(input: string) {
  // Extract up to 9 digits that represent the suffix after the leading '9' in Philippine mobile numbers
  const digits = String(input || "").replace(/\D/g, "");
  let rest = digits;
  if (digits.startsWith("63")) {
    rest = digits.slice(2);
  } else if (digits.startsWith("0")) {
    rest = digits.slice(1);
  }
  // rest should start with '9' for mobile numbers; if so, suffix is next 9 digits after that 9
  if (rest.startsWith("9")) {
    return rest.slice(1, 10); // up to 9 digits
  }
  // otherwise take last up to 9 digits as a best-effort suffix
  return rest.slice(-9);
}

export function formatPhoneFromSuffix(suffix: string) {
  const digits = String(suffix || "").replace(/\D/g, "").slice(0, 9);
  // groups: 2,3,4
  const g1 = digits.slice(0, 2);
  const g2 = digits.slice(2, 5);
  const g3 = digits.slice(5, 9);
  const parts: string[] = ["+63-9"];
  const restParts: string[] = [];
  if (g1) restParts.push(g1);
  if (g2) restParts.push(g2);
  if (g3) restParts.push(g3);
  if (restParts.length) parts.push(restParts.join("-"));
  return parts.join("-");
}

export function formatPhoneFromAny(input: string) {
  const suffix = extractPhoneSuffix(input);
  return formatPhoneFromSuffix(suffix);
}
