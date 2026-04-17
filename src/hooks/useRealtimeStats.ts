'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type CertificateTable = 'hbe_certificates' | 'saf_certificates' | 'fueleu_maritime_certificates'

export type HbeStats = {
  totalCertificates: number
  totalEnergyGj: number
  latestDeliveryDate: string | null
}

export type SafStats = {
  totalCertificates: number
  totalVolumeMt: number
  avgGhgReduction: number
  corsiaEligibleCount: number
}

export type FuelEuStats = {
  totalCertificates: number
  totalFuelConsumptionMt: number
  avgGhgIntensity: number
  compliantCount: number
  uniqueVessels: number
}

function formatDateForDisplay(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function useRealtimeHbeStats(sourceId: string, companyId: string, initialStats: HbeStats) {
  const [stats, setStats] = useState<HbeStats>(initialStats)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, count } = await supabase
      .from('hbe_certificates')
      .select('energy_delivered_gj, delivery_date', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('source_id', sourceId)

    if (!data || data.length === 0) {
      setStats({
        totalCertificates: 0,
        totalEnergyGj: 0,
        latestDeliveryDate: null,
      })
    } else {
      let totalEnergyGj = 0
      let latestDate: string | null = null

      for (const cert of data) {
        totalEnergyGj += Number(cert.energy_delivered_gj) || 0
        if (cert.delivery_date && (!latestDate || cert.delivery_date > latestDate)) {
          latestDate = cert.delivery_date
        }
      }

      setStats({
        totalCertificates: count || data.length,
        totalEnergyGj: Math.round(totalEnergyGj * 100) / 100,
        latestDeliveryDate: formatDateForDisplay(latestDate),
      })
    }
    setIsLoading(false)
  }, [sourceId, companyId])

  useEffect(() => {
    const supabase = createClient()

    const channel: RealtimeChannel = supabase
      .channel(`hbe-stats-${sourceId}-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hbe_certificates',
        },
        (payload) => {
          console.log('HBE realtime event:', payload)
          fetchStats()
        }
      )
      .subscribe((status) => {
        console.log('HBE subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sourceId, companyId, fetchStats])

  return { stats, isLoading, refetch: fetchStats }
}

export function useRealtimeSafStats(sourceId: string, companyId: string, initialStats: SafStats) {
  const [stats, setStats] = useState<SafStats>(initialStats)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, count } = await supabase
      .from('saf_certificates')
      .select('volume_mt, ghg_reduction_percentage, corsia_eligible', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('source_id', sourceId)

    if (!data || data.length === 0) {
      setStats({
        totalCertificates: 0,
        totalVolumeMt: 0,
        avgGhgReduction: 0,
        corsiaEligibleCount: 0,
      })
    } else {
      let totalVolumeMt = 0
      let totalGhgReduction = 0
      let corsiaEligibleCount = 0

      for (const cert of data) {
        totalVolumeMt += Number(cert.volume_mt) || 0
        totalGhgReduction += Number(cert.ghg_reduction_percentage) || 0
        if (cert.corsia_eligible) corsiaEligibleCount++
      }

      setStats({
        totalCertificates: count || data.length,
        totalVolumeMt: Math.round(totalVolumeMt * 100) / 100,
        avgGhgReduction: Math.round((totalGhgReduction / data.length) * 100) / 100,
        corsiaEligibleCount,
      })
    }
    setIsLoading(false)
  }, [sourceId, companyId])

  useEffect(() => {
    const supabase = createClient()

    const channel: RealtimeChannel = supabase
      .channel(`saf-stats-${sourceId}-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saf_certificates',
        },
        (payload) => {
          console.log('SAF realtime event:', payload)
          fetchStats()
        }
      )
      .subscribe((status) => {
        console.log('SAF subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sourceId, companyId, fetchStats])

  return { stats, isLoading, refetch: fetchStats }
}

export function useRealtimeFuelEuStats(sourceId: string, companyId: string, initialStats: FuelEuStats) {
  const [stats, setStats] = useState<FuelEuStats>(initialStats)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, count } = await supabase
      .from('fueleu_maritime_certificates')
      .select('total_fuel_consumption_mt, ghg_intensity_gco2eq_mj, compliance_status, imo_number', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('source_id', sourceId)

    if (!data || data.length === 0) {
      setStats({
        totalCertificates: 0,
        totalFuelConsumptionMt: 0,
        avgGhgIntensity: 0,
        compliantCount: 0,
        uniqueVessels: 0,
      })
    } else {
      let totalFuelConsumptionMt = 0
      let totalGhgIntensity = 0
      let compliantCount = 0
      const uniqueImos = new Set<string>()

      for (const cert of data) {
        totalFuelConsumptionMt += Number(cert.total_fuel_consumption_mt) || 0
        totalGhgIntensity += Number(cert.ghg_intensity_gco2eq_mj) || 0
        if (cert.compliance_status === 'compliant') compliantCount++
        uniqueImos.add(cert.imo_number)
      }

      setStats({
        totalCertificates: count || data.length,
        totalFuelConsumptionMt: Math.round(totalFuelConsumptionMt * 100) / 100,
        avgGhgIntensity: Math.round((totalGhgIntensity / data.length) * 100) / 100,
        compliantCount,
        uniqueVessels: uniqueImos.size,
      })
    }
    setIsLoading(false)
  }, [sourceId, companyId])

  useEffect(() => {
    const supabase = createClient()

    const channel: RealtimeChannel = supabase
      .channel(`fueleu-stats-${sourceId}-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fueleu_maritime_certificates',
        },
        (payload) => {
          console.log('FuelEU realtime event:', payload)
          fetchStats()
        }
      )
      .subscribe((status) => {
        console.log('FuelEU subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sourceId, companyId, fetchStats])

  return { stats, isLoading, refetch: fetchStats }
}
