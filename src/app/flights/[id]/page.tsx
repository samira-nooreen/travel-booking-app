import { supabase } from '@/lib/supabase'
import type { Flight } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { FlightDetailClient } from './FlightDetailClient'
import { notFound } from 'next/navigation'

async function getFlight(id: string): Promise<Flight | null> {
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching flight:', error)
    return null
  }
  return data
}

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const flight = await getFlight(id)

  if (!flight) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <FlightDetailClient flight={flight} />
    </div>
  )
}
