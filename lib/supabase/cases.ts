import "server-only"

import { createClient } from "@/lib/supabase/server"
import type {
  ConsentedCase,
  ProfessionalSettableStatus,
} from "@/types"

// Calls the get_consented_cases() RPC.
// Only returns cases where the caller holds an active (non-revoked) consent.
// transcript / summary come back null when not included in shared_fields.
export async function getConsentedCases(): Promise<ConsentedCase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_consented_cases")
  if (error) throw new Error(error.message)
  return (data ?? []) as ConsentedCase[]
}

// Calls the update_case_status() RPC.
// The RPC rejects non-consented cases and any status outside the allowed set.
export async function updateCaseStatus(
  caseId: string,
  status: ProfessionalSettableStatus
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("update_case_status", {
    p_case_id: caseId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
}

// NOTE on audit_log: it has no SELECT policy. Never write
//   admin.from("audit_log").insert(row).select()
// because the trailing select() will be denied by RLS. Insert without
// chaining .select(), or read audit entries through the admin client
// (service role) only.