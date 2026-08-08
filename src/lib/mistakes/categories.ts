export const MISTAKE_CATEGORIES = [
  "missed_hashmap",
  "overused_sorting",
  "recursion_fear",
  "wrong_complexity",
  "edge_case",
  "wrong_ds",
  "brute_force_stuck",
  "misread_constraints",
  "other",
] as const;

export type MistakeCategory = (typeof MISTAKE_CATEGORIES)[number];

export const MISTAKE_CATEGORY_SET = new Set<string>(MISTAKE_CATEGORIES);
