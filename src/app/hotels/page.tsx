"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Hotel } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { HotelCard } from '@/components/HotelCard'
import { HotelsFilter } from './HotelsFilter'
import { Radio, Loader2 } from 'lucide-react'

interface SearchParams {
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: string
  minPrice?: string
  maxPrice?: string
}

export default function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState<SearchParams>({})

  useEffect(() => {
    searchParams.then(setParams)
  }, [searchParams])

  useEffect(() => {
    async function fetchHotels() {
      setLoading(true)
      let query = supabase.from('hotels').select('*')
      
      if (params.city) {
        query = query.ilike('city', `%${params.city}%`)
      }
      if (params.minPrice) {
        query = query.gte('price_per_night', parseFloat(params.minPrice))
      }
      if (params.maxPrice) {
        query = query.lte('price_per_night', parseFloat(params.maxPrice))
      }
      
      const { data, error } = await query.order('rating', { ascending: false })
      
      if (error) {
        console.error('Error fetching hotels:', error)
        setHotels([])
      } else {
        setHotels(data || [])
      }
      setLoading(false)
    }

    fetchHotels()

    const channel = supabase
      .channel('hotels-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hotels' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setHotels((prev) =>
              prev.map((hotel) =>
                hotel.id === payload.new.id ? (payload.new as Hotel) : hotel
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white font-serif">Find Your Stay</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">LIVE</span>
              </div>
            </div>
            <p className="text-slate-400">
              {loading ? 'Loading hotels...' : `${hotels.length} hotel${hotels.length !== 1 ? 's' : ''} available`}
              {params.city && ` in ${params.city}`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <HotelsFilter initialParams={params} />
            </aside>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                  <p className="text-slate-400">Loading hotels...</p>
                </div>
              ) : hotels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <p className="text-xl text-slate-400 mb-4">No hotels found matching your criteria</p>
                  <p className="text-slate-500">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
