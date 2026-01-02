import { supabase } from '@/lib/supabase'
import type { Hotel } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { HotelDetailClient } from './HotelDetailClient'
import { notFound } from 'next/navigation'

async function getHotel(id: string): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching hotel:', error)
    return null
  }
  return data
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const hotel = await getHotel(id)

  if (!hotel) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <HotelDetailClient hotel={hotel} />
    </div>
  )
}
