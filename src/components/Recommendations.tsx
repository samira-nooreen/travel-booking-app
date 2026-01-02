'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Plane, Building2, Sparkles } from 'lucide-react'
import { supabase, type Flight, type Hotel } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Recommendation {
  type: 'flight' | 'hotel'
  item: Flight | Hotel
  reason: string
}

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const [{ data: flights }, { data: hotels }] = await Promise.all([
        supabase
          .from('flights')
          .select('*')
          .order('seats_available', { ascending: true })
          .limit(3),
        supabase
          .from('hotels')
          .select('*')
          .order('rating', { ascending: false })
          .limit(3),
      ])

      const recs: Recommendation[] = []

      if (flights) {
        flights.forEach((flight, index) => {
          const reasons = [
            'Popular route - booking fast!',
            'Great value for this route',
            'Limited seats available',
          ]
          recs.push({
            type: 'flight',
            item: flight,
            reason: reasons[index] || 'Recommended for you',
          })
        })
      }

      if (hotels) {
        hotels.forEach((hotel, index) => {
          const reasons = [
            'Top-rated by travelers',
            'Excellent location',
            'Best value in area',
          ]
          recs.push({
            type: 'hotel',
            item: hotel,
            reason: reasons[index] || 'Recommended for you',
          })
        })
      }

      const shuffled = recs.sort(() => Math.random() - 0.5).slice(0, 4)
      setRecommendations(shuffled)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">Recommended for You</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-white">Recommended for You</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const isFlightRec = rec.type === 'flight'
          const item = rec.item as Flight & Hotel

          return (
            <Link
              key={`${rec.type}-${item.id}`}
              href={`/${rec.type}s/${item.id}`}
              className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isFlightRec ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {isFlightRec ? <Plane className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {isFlightRec
                    ? `${(item as Flight).departure_city} → ${(item as Flight).arrival_city}`
                    : (item as Hotel).name}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <p className="text-xs text-slate-400 truncate">{rec.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-amber-400">
                  {formatCurrency(item.price)}
                </p>
                <p className="text-xs text-slate-500">
                  {isFlightRec ? 'per seat' : 'per night'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
