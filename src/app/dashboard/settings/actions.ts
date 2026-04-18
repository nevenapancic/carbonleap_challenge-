'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ThemeMode } from '@/lib/types/database'

export async function updateThemeMode(companyId: string, themeMode: ThemeMode) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('companies')
    .update({ theme_mode: themeMode })
    .eq('id', companyId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getThemeMode(companyId: string): Promise<ThemeMode> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('companies')
    .select('theme_mode')
    .eq('id', companyId)
    .single()

  return data?.theme_mode || 'dark'
}
