import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose class names, letting a later Tailwind utility win over an earlier one
 * in the same group. Without the merge, a variant passed in by a caller loses
 * to the component's own base class purely by source order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
