import { createClient } from '@/lib/supabase/server'
import type { Source } from '@/lib/types/database'

export async function getSources(): Promise<Source[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getSourceByName(name: string): Promise<Source | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('name', name)
    .single()

  if (error) {
    return null
  }

  return data
}
