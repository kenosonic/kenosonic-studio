import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type NotificationAction = 'viewed' | 'approved' | 'signed' | 'completed'

export interface KSNotification {
  id: string
  created_at: string
  document_id: string
  client_id: string
  client_name: string
  action: NotificationAction
  document_title: string
  document_reference: string
  read: boolean
}

export interface NotificationGroup {
  client_id: string
  client_name: string
  latest: KSNotification
  rest: KSNotification[]
  hasUnread: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<KSNotification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setNotifications((data as KSNotification[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('notifications-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refresh])

  const unreadCount = notifications.filter(n => !n.read).length

  const groups: NotificationGroup[] = []
  const seenClients = new Set<string>()
  for (const n of notifications) {
    if (seenClients.has(n.client_id)) continue
    seenClients.add(n.client_id)
    const all = notifications.filter(x => x.client_id === n.client_id)
    groups.push({
      client_id: n.client_id,
      client_name: n.client_name,
      latest: all[0],
      rest: all.slice(1),
      hasUnread: all.some(x => !x.read),
    })
  }

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  return { groups, unreadCount, loading, markAllRead, refresh }
}

export function createNotification(data: Omit<KSNotification, 'id' | 'created_at' | 'read'>) {
  supabase.from('notifications').insert({ ...data, read: false }).then()
}
