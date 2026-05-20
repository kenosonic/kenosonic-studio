import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, CrmLead, WizardData } from '../types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ks_clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setClients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  return { clients, loading, error, refetch: fetchClients }
}

export function useClient(id: string | undefined) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    supabase.from('ks_clients').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) setError(error.message)
      else setClient(data)
      setLoading(false)
    })
  }, [id])

  return { client, setClient, loading, error }
}

export function useCrmLeads() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('ks_available_leads')
      .select('*')
      .then(({ data }) => {
        setLeads((data as CrmLead[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { leads, loading }
}

type ClientUpdate = Omit<Partial<Client>, 'id' | 'created_at' | 'created_by' | 'address_line2' | 'registration_number' | 'vat_number' | 'notes' | 'logo_url'> & {
  address_line2?: string | null
  registration_number?: string | null
  vat_number?: string | null
  notes?: string | null
  logo_url?: string | null
}

export async function updateClient(id: string, data: ClientUpdate) {
  const { error } = await supabase.from('ks_clients').update(data).eq('id', id)
  if (error) throw error
}

export async function createClient(data: WizardData, userId: string, crmLeadId?: string) {
  const { data: client, error } = await supabase.from('ks_clients').insert({
    company_name: data.company_name,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    address_line1: data.address_line1,
    address_line2: data.address_line2 || null,
    city: data.city,
    province: data.province,
    country: data.country || 'ZA',
    registration_number: data.registration_number || null,
    vat_number: data.vat_number || null,
    industry: data.industry,
    notes: data.notes || null,
    status: 'active',
    created_by: userId,
    crm_lead_id: crmLeadId ?? null,
  }).select().single()

  if (error) throw error
  return client as Client
}

export async function createProject(clientId: string, data: Pick<WizardData, 'project_name' | 'service_type' | 'project_value'>) {
  if (!data.project_name || !data.service_type) return null
  const { data: project, error } = await supabase.from('ks_projects').insert({
    client_id: clientId,
    name: data.project_name,
    service_type: data.service_type,
    value: data.project_value ? parseFloat(data.project_value) : null,
    status: 'prospect',
  }).select().single()
  if (error) throw error
  return project
}
