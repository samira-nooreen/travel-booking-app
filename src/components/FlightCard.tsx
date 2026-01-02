"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Plane, Clock, Users, MapPin } from 'lucide-react'
import type { Flight } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FlightStatusBadge } from './FlightStatusBadge'

interface FlightCardProps {
  flight: Flight
}

export function FlightCard({ flight }: FlightCardProps) {
  const classColors = {
    economy: 'bg-slate-700 text-slate-300',
    business: 'bg-blue-500/20 text-blue-400',
    first: 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={flight.image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800'}
          alt={`${flight.airline} - ${flight.flight_number}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className={classColors[flight.class]}>
            {flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <FlightStatusBadge 
            status={flight.status || 'on_time'} 
            delayMinutes={flight.delay_minutes} 
            size="sm" 
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Plane className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">{flight.airline}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">{flight.flight_number}</span>
            </div>
            {flight.gate && (
              <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                <MapPin className="w-3 h-3" />
                Gate {flight.gate}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{flight.departure_airport}</p>
            <p className="text-sm text-slate-400">{flight.departure_city}</p>
            <p className="text-amber-400 font-medium">{formatTime(flight.departure_time)}</p>
          </div>
          <div className="flex-1 mx-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-amber-500/50" />
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Clock className="w-3 h-3" />
                {formatDuration(flight.departure_time, flight.arrival_time)}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-slate-700" />
            </div>
            <p className="text-center text-xs text-slate-500 mt-1">{formatDate(flight.departure_time)}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{flight.arrival_airport}</p>
            <p className="text-sm text-slate-400">{flight.arrival_city}</p>
            <p className="text-amber-400 font-medium">{formatTime(flight.arrival_time)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-2xl font-bold text-white">{formatCurrency(flight.price)}</p>
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <Users className="w-3 h-3" />
              {flight.seats_available} seats left
            </div>
          </div>
          <Link href={`/flights/${flight.id}`}>
            <Button className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
