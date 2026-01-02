"use client"

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { RealFlightCard } from '@/components/RealFlightCard'
import { FlightsFilter } from './FlightsFilter'
import { Loader2, AlertCircle, Radio } from 'lucide-react'

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

interface SearchParams {
  from?: string
  to?: string
  date?: string
  class?: string
}

export default function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [flights, setFlights] = useState<RealFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<SearchParams>({})

  useEffect(() => {
    searchParams.then(setParams)
  }, [searchParams])

  useEffect(() => {
    async function fetchFlights() {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        if (params.from) queryParams.append('from', params.from)
        if (params.to) queryParams.append('to', params.to)

        const response = await fetch(`/api/flights?${queryParams.toString()}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
          setFlights([])
        } else {
          setFlights(data.flights || [])
        }
      } catch {
        setError('Failed to fetch flights')
        setFlights([])
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [params])

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white font-serif">Real-Time Flights</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">LIVE</span>
              </div>
            </div>
            <p className="text-slate-400">
              {loading ? 'Loading flights...' : `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`}
              {params.from && ` from ${params.from.toUpperCase()}`}
              {params.to && ` to ${params.to.toUpperCase()}`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <FlightsFilter initialParams={params} />
            </aside>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                  <p className="text-slate-400">Fetching real-time flight data...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-red-500/30">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
                  <p className="text-xl text-red-400 mb-2">Error</p>
                  <p className="text-slate-400 text-center max-w-md">{error}</p>
                  <p className="text-slate-500 text-sm mt-4">Please check that your API key is configured</p>
                </div>
              ) : flights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {flights.map((flight) => (
                    <RealFlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <p className="text-xl text-slate-400 mb-4">No flights found matching your criteria</p>
                  <p className="text-slate-500">Try adjusting your search filters (use IATA codes like JFK, LAX, LHR)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
