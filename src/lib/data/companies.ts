import { createClient } from '@/lib/supabase/server'
import type { Company, Source, Upload } from '@/lib/types/database'

export async function getCompanyByEmail(email: string): Promise<Company | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getCompanySources(companyId: string): Promise<Source[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('company_sources')
    .select('source_id, sources(*)')
    .eq('company_id', companyId)

  if (error || !data) {
    return []
  }

  return data.map((cs) => cs.sources as unknown as Source)
}

export async function getCompanySourcesWithStats(companyId: string) {
  const supabase = await createClient()

  const { data: companySources } = await supabase
    .from('company_sources')
    .select('source_id, sources(*)')
    .eq('company_id', companyId)

  if (!companySources || companySources.length === 0) {
    return []
  }

  const sourcesWithStats = await Promise.all(
    companySources.map(async (cs) => {
      const source = cs.sources as unknown as Source

      const { count } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', source.id)

      const { data: uploads } = await supabase
        .from('uploads')
        .select('id')
        .eq('company_id', companyId)
        .eq('source_id', source.id)

      return {
        source,
        certificateCount: count || 0,
        uploadCount: uploads?.length || 0,
      }
    })
  )

  return sourcesWithStats
}

type UploadWithSource = Upload & {
  source: Source
  certificateCount: number
}

export async function getCompanyUploads(companyId: string): Promise<UploadWithSource[]> {
  const supabase = await createClient()

  const { data: uploads } = await supabase
    .from('uploads')
    .select('*, sources(*)')
    .eq('company_id', companyId)
    .order('uploaded_at', { ascending: false })
    .limit(10)

  if (!uploads) {
    return []
  }

  const uploadsWithCounts = await Promise.all(
    uploads.map(async (upload) => {
      const { count } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('upload_id', upload.id)

      return {
        ...upload,
        source: upload.sources as unknown as Source,
        certificateCount: count || 0,
      }
    })
  )

  return uploadsWithCounts
}
