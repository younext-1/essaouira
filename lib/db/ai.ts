import { createClient } from '@/lib/supabase/server'

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export async function getConversation(userId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('messages')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return []
  return (data.messages as ChatMessage[]) ?? []
}

export async function saveConversation(userId: string, messages: ChatMessage[]) {
  const supabase = await createClient()

  // Upsert: check if conversation exists
  const { data: existing } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('ai_conversations')
      .update({
        messages: JSON.stringify(messages),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) throw error
  } else {
    const { error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        messages: JSON.stringify(messages),
      })

    if (error) throw error
  }
}
