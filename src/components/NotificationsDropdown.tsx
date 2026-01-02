'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, Plane, DollarSign, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, type Notification } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { formatDistanceToNow } from 'date-fns'

const notificationIcons: Record<string, React.ElementType> = {
  flight_delay: AlertTriangle,
  gate_change: Plane,
  price_drop: DollarSign,
  booking_confirmed: CheckCircle,
  booking_cancelled: X,
  refund_processed: RefreshCw,
  general: Bell,
}

const notificationColors: Record<string, string> = {
  flight_delay: 'text-amber-400 bg-amber-500/20',
  gate_change: 'text-blue-400 bg-blue-500/20',
  price_drop: 'text-emerald-400 bg-emerald-500/20',
  booking_confirmed: 'text-emerald-400 bg-emerald-500/20',
  booking_cancelled: 'text-red-400 bg-red-500/20',
  refund_processed: 'text-purple-400 bg-purple-500/20',
  general: 'text-slate-400 bg-slate-500/20',
}

export function NotificationsDropdown() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    const notification = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-400 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-slate-950 font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = notificationIcons[notification.type] || Bell
                  const colorClass = notificationColors[notification.type] || notificationColors.general
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                        !notification.is_read ? 'bg-slate-700/20' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-white text-sm">{notification.title}</p>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-slate-500 hover:text-slate-300 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-slate-400 text-sm mt-0.5">{notification.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
