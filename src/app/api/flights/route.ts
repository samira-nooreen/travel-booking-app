import { NextRequest, NextResponse } from 'next/server'

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY

interface AviationStackFlight {
  flight_date: string
  flight_status: string
  departure: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal: string | null
    gate: string | null
    delay: number | null
    scheduled: string
    estimated: string
    actual: string | null
    estimated_runway: string | null
    actual_runway: string | null
  }
  arrival: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal: string | null
    gate: string | null
    baggage: string | null
    delay: number | null
    scheduled: string
    estimated: string
    actual: string | null
    estimated_runway: string | null
    actual_runway: string | null
  }
  airline: {
    name: string
    iata: string
    icao: string
  }
  flight: {
    number: string
    iata: string
    icao: string
    codeshared: unknown
  }
  aircraft: {
    registration: string
    iata: string
    icao: string
    icao24: string
  } | null
  live: {
    updated: string
    latitude: number
    longitude: number
    altitude: number
    direction: number
    speed_horizontal: number
    speed_vertical: number
    is_ground: boolean
  } | null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = searchParams.get('limit') || '20'

  if (!AVIATIONSTACK_API_KEY) {
    return NextResponse.json(
      { error: 'AviationStack API key not configured' },
      { status: 500 }
    )
  }

  try {
    const params = new URLSearchParams({
      access_key: AVIATIONSTACK_API_KEY,
      limit: limit,
    })

    if (from) {
      params.append('dep_iata', from.toUpperCase())
    }
    if (to) {
      params.append('arr_iata', to.toUpperCase())
    }

    const response = await fetch(
      `http://api.aviationstack.com/v1/flights?${params.toString()}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from AviationStack')
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'API error' },
        { status: 400 }
      )
    }

    const flights = (data.data || []).map((flight: AviationStackFlight, index: number) => ({
      id: `${flight.flight.iata}-${index}`,
      flight_number: flight.flight.iata || flight.flight.icao,
      airline: flight.airline.name,
      departure_city: flight.departure.airport,
      departure_code: flight.departure.iata,
      arrival_city: flight.arrival.airport,
      arrival_code: flight.arrival.iata,
      departure_time: flight.departure.scheduled,
      arrival_time: flight.arrival.scheduled,
      status: flight.flight_status,
      terminal: flight.departure.terminal,
      gate: flight.departure.gate,
      delay: flight.departure.delay,
      aircraft: flight.aircraft?.iata || null,
      live: flight.live,
      price: Math.floor(Math.random() * 500) + 150,
      class: ['economy', 'business', 'first'][Math.floor(Math.random() * 3)],
      duration: calculateDuration(flight.departure.scheduled, flight.arrival.scheduled),
    }))

    return NextResponse.json({ flights, total: data.pagination?.total || flights.length })
  } catch (error) {
    console.error('Error fetching flights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    )
  }
}

function calculateDuration(departure: string, arrival: string): string {
  try {
    const dep = new Date(departure)
    const arr = new Date(arrival)
    const diffMs = arr.getTime() - dep.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  } catch {
    return 'N/A'
  }
}
