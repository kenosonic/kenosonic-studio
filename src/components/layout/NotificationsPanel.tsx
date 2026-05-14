import { useNavigate } from 'react-router-dom'
import type { NotificationGroup, NotificationAction } from '../../hooks/useNotifications'

const ACTION_LABELS: Record<NotificationAction, string> = {
  viewed: 'Opened',
  approved: 'Approved',
  signed: 'Signed',
  completed: 'Completed brief',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  groups: NotificationGroup[]
  unreadCount: number
  loading: boolean
  onClose: () => void
  onMarkAllRead: () => void
}

export function NotificationsPanel({ groups, unreadCount, loading, onClose, onMarkAllRead }: Props) {
  const navigate = useNavigate()

  function handleGroupClick(clientId: string) {
    onClose()
    navigate(`/admin/clients/${clientId}`)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[59] bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[60] w-full sm:w-[340px] flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0D0D0D', borderLeft: '0.5px solid #2A2A2A' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '0.5px solid #2A2A2A' }}
        >
          <div className="flex items-center gap-3">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-white">Notifications</p>
            {unreadCount > 0 && (
              <span
                className="font-body font-medium text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#F56E0F', color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#5A5A5A] hover:text-white transition-colors text-[20px] leading-none"
          >×</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 font-body text-[11px] text-[#5A5A5A]">Loading…</p>
          ) : groups.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-body text-[11px] text-[#5A5A5A]">No notifications yet.</p>
            </div>
          ) : (
            groups.map(group => (
              <button
                key={group.client_id}
                onClick={() => handleGroupClick(group.client_id)}
                className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
                style={{ borderBottom: '0.5px solid #1E1E1E' }}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {group.hasUnread && (
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ backgroundColor: '#F56E0F' }}
                      />
                    )}
                    <p className="font-display font-bold text-[13px] text-white truncate">
                      {group.client_name}
                    </p>
                  </div>
                  <span className="font-body text-[10px] flex-shrink-0" style={{ color: '#5A5A5A' }}>
                    {relativeTime(group.latest.created_at)}
                  </span>
                </div>

                <p className="font-body text-[11px] mb-2" style={{ color: '#9A9A9A' }}>
                  <span style={{ color: '#F56E0F' }}>{ACTION_LABELS[group.latest.action]}</span>
                  {' · '}
                  <span className="truncate">{group.latest.document_reference}</span>
                </p>

                {group.rest.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.rest.map(n => (
                      <span
                        key={n.id}
                        className="font-body text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm"
                        style={{ backgroundColor: '#1E1E1E', color: '#5A5A5A' }}
                      >
                        {ACTION_LABELS[n.action]} · {n.document_reference}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {unreadCount > 0 && (
          <div
            className="px-5 py-4 flex-shrink-0"
            style={{ borderTop: '0.5px solid #2A2A2A' }}
          >
            <button
              onClick={onMarkAllRead}
              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-[#5A5A5A] hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </>
  )
}
