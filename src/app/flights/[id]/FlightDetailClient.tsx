"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plane, Clock, Users, Calendar, ArrowRight, Luggage, Utensils, Wifi, Check, MapPin, Bell, BellOff, RefreshCw } from 'lucide-react'
import type { Flight } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBookingStore, useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { FlightStatusBadge } from '@/components/FlightStatusBadge'

interface FlightDetailClientProps {
  flight: Flight
}

export function FlightDetailClient({ flight: initialFlight }: FlightDetailClientProps) {
  const router = useRouter()
  const { setCurrentBooking } = useBookingStore()
  const { user } = useAuthStore()
  const [flight, setFlight] = useState(initialFlight)
  const [hasPriceAlert, setHasPriceAlert] = useState(false)
  const [loadingAlert, setLoadingAlert] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`flight-${flight.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'flights',
        filter: `id=eq.${flight.id}`,
      }, (payload) => {
        setFlight(payload.new as Flight)
        if (payload.new.status !== payload.old?.status) {
          toast.info(`Flight status updated: ${payload.new.status.replace('_', ' ').toUpperCase()}`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flight.id])

  useEffect(() => {
    if (user) {
      checkPriceAlert()
    }
  }, [user, flight.id])

  const checkPriceAlert = async () => {
    if (!user) return
    const { data } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', user.id)
      .eq('flight_id', flight.id)
      .eq('is_active', true)
      .single()
    setHasPriceAlert(!!data)
  }

  const togglePriceAlert = async () => {
    if (!user) {
      toast.error('Please sign in to set price alerts')
      router.push('/login')
      return
    }

    setLoadingAlert(true)
    try {
      if (hasPriceAlert) {
        await supabase
          .from('price_alerts')
          .delete()
          .eq('user_id', user.id)
          .eq('flight_id', flight.id)
        setHasPriceAlert(false)
        toast.success('Price alert removed')
      } else {
        await supabase
          .from('price_alerts')
          .insert({
            user_id: user.id,
            flight_id: flight.id,
            target_price: flight.price * 0.9,
            current_price: flight.price,
          })
        setHasPriceAlert(true)
        toast.success('Price alert set! We\'ll notify you when the price drops.')
      }
    } catch {
      toast.error('Failed to update price alert')
    } finally {
      setLoadingAlert(false)
    }
  }

  const classColors = {
    economy: 'bg-slate-700 text-slate-300',
    business: 'bg-blue-500/20 text-blue-400',
    first: 'bg-amber-500/20 text-amber-400',
  }

  const classFeatures = {
    economy: ['Personal entertainment screen', 'Complimentary snacks', 'Standard legroom'],
    business: ['Priority boarding', 'Extra legroom', 'Premium meals', 'Lounge access'],
    first: ['Lie-flat seats', 'Personal suite', 'Gourmet dining', 'Spa amenities', 'Private lounge'],
  }

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please sign in to book a flight')
      router.push('/login')
      return
    }

    setCurrentBooking({
      type: 'flight',
      item: flight,
      guests: 1,
    })
    router.push('/booking')
  }

  return (
    <main className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {flight.status === 'delayed' && flight.delay_reason && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-semibold">Flight Delayed</p>
              <p className="text-slate-300 text-sm">
                This flight is delayed by {flight.delay_minutes} minutes due to {flight.delay_reason.toLowerCase()}.
              </p>
            </div>
          </div>
        )}

        {flight.status === 'cancelled' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Flight Cancelled</p>
              <p className="text-slate-300 text-sm">
                This flight has been cancelled. Please contact customer support for rebooking or refund options.
              </p>
            </div>
          </div>
        )}

        <div className="relative h-80 rounded-3xl overflow-hidden mb-8">
          <Image
            src={flight.image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200'}
            alt={`${flight.airline} - ${flight.flight_number}`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute top-6 right-6">
            <FlightStatusBadge 
              status={flight.status || 'on_time'} 
              delayMinutes={flight.delay_minutes}
              size="lg"
            />
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge className={classColors[flight.class]}>
                {flight.class.charAt(0).toUpperCase() + flight.class.slice(1)} Class
              </Badge>
              {flight.gate && (
                <Badge className="bg-slate-700/80 text-slate-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  Gate {flight.gate}
                </Badge>
              )}
              {flight.terminal && (
                <Badge className="bg-slate-700/80 text-slate-200">
                  Terminal {flight.terminal}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-white">
              <Plane className="w-6 h-6 text-amber-400" />
              <h1 className="text-3xl font-bold">{flight.airline}</h1>
              <span className="text-slate-400">•</span>
              <span className="text-xl text-slate-300">{flight.flight_number}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Flight Details</h2>
              
              <div className="flex items-center justify-between mb-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{flight.departure_airport}</p>
                  <p className="text-slate-400 mt-1">{flight.departure_city}</p>
                  <p className="text-amber-400 font-semibold text-lg mt-2">{formatTime(flight.departure_time)}</p>
                </div>
                <div className="flex-1 mx-8">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-amber-500/50" />
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <Plane className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-slate-700" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(flight.departure_time, flight.arrival_time)}</span>
                    <span>• Non-stop</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{flight.arrival_airport}</p>
                  <p className="text-slate-400 mt-1">{flight.arrival_city}</p>
                  <p className="text-amber-400 font-semibold text-lg mt-2">{formatTime(flight.arrival_time)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Departure Date</p>
                    <p className="text-white font-medium">{formatDate(flight.departure_time, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Available Seats</p>
                    <p className="text-white font-medium">{flight.seats_available} seats</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">{flight.class.charAt(0).toUpperCase() + flight.class.slice(1)} Class Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classFeatures[flight.class].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-amber-400" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Baggage Allowance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl">
                  <Luggage className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Carry-on</p>
                    <p className="text-slate-400 text-sm">1 bag, 7kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl">
                  <Luggage className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Checked</p>
                    <p className="text-slate-400 text-sm">{flight.class === 'economy' ? '1 bag, 23kg' : flight.class === 'business' ? '2 bags, 32kg each' : '3 bags, 32kg each'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl">
                  <Utensils className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Meals</p>
                    <p className="text-slate-400 text-sm">{flight.class === 'economy' ? 'Snacks included' : 'Full meals'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-white">{formatCurrency(flight.price)}</p>
                <p className="text-slate-400 text-sm mt-1">per person</p>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base fare</span>
                  <span className="text-white">{formatCurrency(flight.price * 0.85)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxes & fees</span>
                  <span className="text-white">{formatCurrency(flight.price * 0.15)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-amber-400">{formatCurrency(flight.price)}</span>
                </div>
              </div>

                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600 h-12 text-base"
                  disabled={flight.seats_available === 0 || flight.status === 'cancelled'}
                >
                  {flight.status === 'cancelled' ? 'Unavailable' : flight.seats_available === 0 ? 'Sold Out' : 'Book Now'}
                  {flight.seats_available > 0 && flight.status !== 'cancelled' && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>

                <Button
                  onClick={togglePriceAlert}
                  variant="outline"
                  className="w-full mt-3 border-slate-600 text-slate-300 hover:bg-slate-700/50 h-10"
                  disabled={loadingAlert}
                >
                  {hasPriceAlert ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Remove Price Alert
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Set Price Alert
                    </>
                  )}
                </Button>

                {flight.seats_available <= 10 && flight.seats_available > 0 && (
                  <p className="text-orange-400 text-sm text-center mt-4">
                    Only {flight.seats_available} seats left at this price!
                  </p>
                )}

              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Free Wi-Fi available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
