import AssistantClient from "@/components/assistant/AssistantClient"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Start — CURERA AI" }

export default async function AssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <AssistantClient isLoggedIn={Boolean(user)} />
}