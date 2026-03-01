import { supabase } from "@/integrations/supabase/client";

/**
 * Compute SHA-256 hash of a file using the Web Crypto API
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface DuplicateMatch {
  id: string;
  bedrag: number;
  leverancier: string | null;
  datum: string;
}

/**
 * Check if a file hash already exists in the project's costs
 * @param projectId - The project to check in
 * @param hash - The SHA-256 hash to look for
 * @param excludeCostId - Optional cost ID to exclude (for edit mode)
 * @returns The matching cost if found, null otherwise
 */
export async function checkDuplicateHash(
  projectId: string,
  hash: string,
  excludeCostId?: string
): Promise<DuplicateMatch | null> {
  let query = supabase
    .from("costs")
    .select("id, bedrag, leverancier, datum")
    .eq("project_id", projectId)
    .contains("file_hashes", [hash]);

  if (excludeCostId) {
    query = query.neq("id", excludeCostId);
  }

  const { data, error } = await query.limit(1);
  if (error) {
    console.error("Error checking duplicate hash:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] as DuplicateMatch : null;
}
