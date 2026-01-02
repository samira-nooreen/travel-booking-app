'use client'

import { FlightStatus } from '@/lib/supabase'
import { Clock, CheckCircle, XCircle, Plane, AlertTriangle } from 'lucide-react'

interface FlightStatusBadgeProps {
  status: FlightStatus
  delayMinutes?: number
  delayReason?: string | null
  showReason?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<FlightStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  on_time: { label: 'On Time', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
  delayed: { label: 'Delayed', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
  boarding: { label: 'Boarding', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Plane },
  departed: { label: 'Departed', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Plane },
  arrived: { label: 'Arrived', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function FlightStatusBadge({ status, delayMinutes, delayReason, showReason = false, size = 'md' }: FlightStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.on_time
  const Icon = config.icon
  
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]}`}>
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>{config.label}</span>
        {status === 'delayed' && delayMinutes && delayMinutes > 0 && (
          <span className="opacity-80">+{formatDelay(delayMinutes)}</span>
        )}
      </div>
      {showReason && status === 'delayed' && delayReason && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <AlertTriangle className="w-3 h-3" />
          <span>{delayReason}</span>
        </div>
      )}
    </div>
  )
}
