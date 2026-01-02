"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Star, Calendar, Users, ArrowRight, Wifi, Dumbbell, UtensilsCrossed, Car, Waves, Check } from 'lucide-react'
import type { Hotel } from '@/lib/supabase'
import { formatCurrency, calculateNights } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookingStore, useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

interface HotelDetailClientProps {
  hotel: Hotel
}

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />,
  Restaurant: <UtensilsCrossed className="w-5 h-5" />,
  'Valet Parking': <Car className="w-5 h-5" />,
  Pool: <Waves className="w-5 h-5" />,
  Spa: <Waves className="w-5 h-5" />,
}

export function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const router = useRouter()
  const { setCurrentBooking } = useBookingStore()
  const { user } = useAuthStore()

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0
  const totalPrice = nights * hotel.price_per_night

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please sign in to book a hotel')
      router.push('/login')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates')
      return
    }

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date')
      return
    }

    setCurrentBooking({
      type: 'hotel',
      item: hotel,
      checkIn,
      checkOut,
      guests,
    })
    router.push('/booking')
  }

  return (
    <main className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative h-96 rounded-3xl overflow-hidden">
            <Image
              src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
              alt={hotel.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(hotel.images || []).slice(0, 4).map((img, i) => (
              <div key={i} className="relative h-44 rounded-2xl overflow-hidden">
                <Image
                  src={img}
                  alt={`${hotel.name} - ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {(!hotel.images || hotel.images.length < 4) && (
              Array.from({ length: 4 - (hotel.images?.length || 0) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="relative h-44 rounded-2xl overflow-hidden bg-slate-800/50" />
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white font-serif mb-2">{hotel.name}</h1>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{hotel.address}</span>
                  </div>
                </div>
                <Badge className="bg-amber-500/90 text-slate-950 font-semibold flex items-center gap-1 text-lg px-3 py-1">
                  <Star className="w-4 h-4 fill-current" />
                  {hotel.rating}
                </Badge>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">{hotel.description}</p>
            </div>

            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {hotel.amenities?.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl">
                    <div className="text-amber-400">
                      {amenityIcons[amenity] || <Check className="w-5 h-5" />}
                    </div>
                    <span className="text-slate-300">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Hotel Policies</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-slate-400 text-sm mb-2">Check-in Time</h3>
                  <p className="text-white font-medium">3:00 PM - 11:00 PM</p>
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm mb-2">Check-out Time</h3>
                  <p className="text-white font-medium">Before 12:00 PM</p>
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm mb-2">Cancellation Policy</h3>
                  <p className="text-white font-medium">Free cancellation up to 48 hours before check-in</p>
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm mb-2">Payment</h3>
                  <p className="text-white font-medium">Pay at property or online</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-white">{formatCurrency(hotel.price_per_night)}</p>
                <p className="text-slate-400 text-sm mt-1">per night</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Check-in</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Check-out</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Guests</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                      className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {nights > 0 && (
                <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{formatCurrency(hotel.price_per_night)} x {nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="text-white">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Taxes & fees</span>
                    <span className="text-white">{formatCurrency(totalPrice * 0.12)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-4 border-t border-slate-700/50">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400">{formatCurrency(totalPrice * 1.12)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBookNow}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600 h-12 text-base"
                disabled={hotel.rooms_available === 0}
              >
                {hotel.rooms_available === 0 ? 'Fully Booked' : 'Reserve Now'}
                {hotel.rooms_available > 0 && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>

              {hotel.rooms_available <= 5 && hotel.rooms_available > 0 && (
                <p className="text-orange-400 text-sm text-center mt-4">
                  Only {hotel.rooms_available} rooms left!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
