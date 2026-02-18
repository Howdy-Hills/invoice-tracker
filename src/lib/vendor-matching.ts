/**
 * Vendor name normalisation and matching utilities.
 * Used to match parsed vendor names against the vendor memory table.
 */

/**
 * Normalise a vendor name for consistent matching.
 * - lowercases
 * - removes common suffixes (LLC, Inc, Co, Corp, etc.)
 * - removes punctuation
 * - collapses whitespace
 */
export function normalizeVendorName(name: string): string {
  let n = name.toLowerCase().trim();

  // Strip common business suffixes
  const suffixes = [
    /\b(llc|l\.l\.c\.?|inc\.?|incorporated|corp\.?|corporation|co\.?|company|ltd\.?|limited|lp|l\.p\.?|plc|pllc|dba|d\/b\/a)\b/gi,
  ];
  for (const pat of suffixes) {
    n = n.replace(pat, "");
  }

  // Remove punctuation, collapse whitespace
  n = n
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return n;
}

/**
 * Simple similarity check between two normalised vendor names.
 * Returns a score 0–1.
 */
export function vendorSimilarity(a: string, b: string): number {
  const na = normalizeVendorName(a);
  const nb = normalizeVendorName(b);

  if (na === nb) return 1;
  if (!na || !nb) return 0;

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Token overlap (Jaccard-ish)
  const tokA = new Set(na.split(" "));
  const tokB = new Set(nb.split(" "));
  const intersection = [...tokA].filter((t) => tokB.has(t)).length;
  const union = new Set([...tokA, ...tokB]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Find the best matching vendor from a list of known vendor names.
 */
export function findBestVendorMatch(
  parsedName: string,
  knownVendors: { name: string; normalizedName: string | null; id: string }[],
  minSimilarity = 0.7
): { vendorId: string; vendorName: string; similarity: number } | null {
  if (!parsedName) return null;

  let best: {
    vendorId: string;
    vendorName: string;
    similarity: number;
  } | null = null;

  for (const v of knownVendors) {
    const sim = vendorSimilarity(parsedName, v.normalizedName ?? v.name);
    if (sim >= minSimilarity && (!best || sim > best.similarity)) {
      best = { vendorId: v.id, vendorName: v.name, similarity: sim };
    }
  }

  return best;
}
