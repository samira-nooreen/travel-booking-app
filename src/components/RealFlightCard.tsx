"use client"

import { Plane, Clock, MapPin, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RealFlight {
  id: string
  flight_number: string
  airline: string
  departure_city: string
  departure_code: string
  arrival_city: string
  arrival_code: string
  departure_time: string
  arrival_time: string
  status: string
  terminal: string | null
  gate: string | null
  delay: number | null
  duration: string
}

interface RealFlightCardProps {
  flight: RealFlight
}

export function RealFlightCard({ flight }: RealFlightCardProps) {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    landed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    incident: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    diverted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return 'N/A'
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Plane className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <p className="font-semibold text-white">{flight.airline}</p>
              <p className="text-sm text-slate-400">{flight.flight_number}</p>
            </div>
          </div>
          <Badge className={statusColors[flight.status] || statusColors.scheduled}>
            {flight.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{flight.departure_code}</p>
            <p className="text-xs text-slate-400 max-w-[100px] truncate">{flight.departure_city}</p>
            <p className="text-amber-400 font-medium text-sm">{formatTime(flight.departure_time)}</p>
          </div>
          <div className="flex-1 mx-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-amber-500/50" />
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Clock className="w-3 h-3" />
                {flight.duration}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-slate-700" />
            </div>
            <p className="text-center text-xs text-slate-500 mt-1">{formatDate(flight.departure_time)}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{flight.arrival_code}</p>
            <p className="text-xs text-slate-400 max-w-[100px] truncate">{flight.arrival_city}</p>
            <p className="text-amber-400 font-medium text-sm">{formatTime(flight.arrival_time)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-4 text-sm">
            {flight.terminal && (
              <div className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3" />
                Terminal {flight.terminal}
              </div>
            )}
            {flight.gate && (
              <div className="flex items-center gap-1 text-slate-400">
                Gate {flight.gate}
              </div>
            )}
          </div>
          {flight.delay && flight.delay > 0 && (
            <div className="flex items-center gap-1 text-orange-400 text-sm">
              <AlertCircle className="w-3 h-3" />
              {flight.delay} min delay
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
