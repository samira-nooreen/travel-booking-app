"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaxiProvider, TaxiBooking } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Radio, 
  Loader2, 
  MapPin, 
  Navigation, 
  Star, 
  Clock, 
  Car, 
  Zap,
  TrendingUp,
  Users,
  Phone,
  X,
  CheckCircle,
  Navigation2,
  Shield
} from 'lucide-react'

const PROVIDER_LOGOS: Record<string, string> = {
  'Uber': '/logos/uber.svg',
  'Ola': '/logos/ola.svg',
  'Rapido': '/logos/rapido.svg'
}

const POPULAR_LOCATIONS = [
  'Indira Gandhi International Airport, Delhi',
  'Chhatrapati Shivaji Airport, Mumbai',
  'Kempegowda International Airport, Bangalore',
  'Chennai International Airport',
  'Rajiv Gandhi International Airport, Hyderabad',
  'Netaji Subhas Chandra Bose Airport, Kolkata',
  'Sardar Vallabhbhai Patel Airport, Ahmedabad',
  'Cochin International Airport, Kochi',
  'Pune Airport',
  'Jaipur International Airport',
  'Connaught Place, Delhi',
  'MG Road, Bangalore',
  'Marine Drive, Mumbai',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
  'Bandra, Mumbai',
  'Andheri, Mumbai',
  'Whitefield, Bangalore',
  'Electronic City, Bangalore',
  'Powai, Mumbai',
  'Gurgaon Cyber City',
  'Noida Sector 62',
  'Salt Lake, Kolkata',
  'T Nagar, Chennai',
  'Banjara Hills, Hyderabad',
  'Jubilee Hills, Hyderabad',
  'Anna Nagar, Chennai',
  'Hitech City, Hyderabad',
  'Marathahalli, Bangalore',
  'HSR Layout, Bangalore'
]

const DRIVER_NAMES = ['Rajesh Kumar', 'Amit Sharma', 'Suresh Patel', 'Vikram Singh', 'Mohammed Ali', 'Deepak Verma']
const CAR_MODELS = ['Swift Dzire', 'Honda City', 'Maruti Ertiga', 'Toyota Innova', 'Hyundai Verna', 'Maruti WagonR']
const CAR_PREFIXES = ['DL', 'MH', 'KA', 'TN', 'UP']

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function generateCarNumber() {
  const prefix = CAR_PREFIXES[Math.floor(Math.random() * CAR_PREFIXES.length)]
  const num1 = Math.floor(10 + Math.random() * 90)
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const num2 = Math.floor(1000 + Math.random() * 9000)
  return `${prefix} ${num1} ${letters} ${num2}`
}

export default function TaxisPage() {
  const [providers, setProviders] = useState<TaxiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [distance, setDistance] = useState(15)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [booking, setBooking] = useState<TaxiBooking | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false)
  const pickupRef = useRef<HTMLDivElement>(null)
  const dropoffRef = useRef<HTMLDivElement>(null)

  const calculateFare = useCallback((provider: TaxiProvider) => {
    const baseFare = Number(provider.base_fare) || 0
    const perKmRate = Number(provider.per_km_rate) || 0
    const surgeMultiplier = Number(provider.surge_multiplier) || 1
    return Math.round((baseFare + (perKmRate * distance)) * surgeMultiplier)
  }, [distance])

  const filterLocations = useCallback((query: string) => {
    if (!query || query.length < 2) return []
    const lowerQuery = query.toLowerCase()
    return POPULAR_LOCATIONS.filter(loc => 
      loc.toLowerCase().includes(lowerQuery)
    ).slice(0, 5)
  }, [])

  const handlePickupChange = (value: string) => {
    setPickup(value)
    const suggestions = filterLocations(value)
    setPickupSuggestions(suggestions)
    setShowPickupSuggestions(suggestions.length > 0)
  }

  const handleDropoffChange = (value: string) => {
    setDropoff(value)
    const suggestions = filterLocations(value)
    setDropoffSuggestions(suggestions)
    setShowDropoffSuggestions(suggestions.length > 0)
  }

  const selectPickupLocation = (location: string) => {
    setPickup(location)
    setShowPickupSuggestions(false)
  }

  const selectDropoffLocation = (location: string) => {
    setDropoff(location)
    setShowDropoffSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false)
      }
      if (dropoffRef.current && !dropoffRef.current.contains(event.target as Node)) {
        setShowDropoffSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true)
      const { data, error } = await supabase
        .from('taxi_providers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })

      if (error) {
        console.error('Error fetching taxi providers:', error)
        setProviders([])
      } else {
        setProviders(data || [])
      }
      setLoading(false)
    }

    fetchProviders()

    const channel = supabase
      .channel('taxis-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'taxi_providers' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setProviders((prev) =>
              prev.map((provider) =>
                provider.id === payload.new.id ? (payload.new as TaxiProvider) : provider
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (booking) return
    
    const interval = setInterval(() => {
      setProviders(prev => prev.map(p => ({
        ...p,
        eta_minutes: Math.max(2, p.eta_minutes + Math.floor(Math.random() * 3) - 1),
        available_cars: Math.max(1, p.available_cars + Math.floor(Math.random() * 5) - 2),
        surge_multiplier: Math.max(1, Math.min(2.5, Number(p.surge_multiplier) + (Math.random() - 0.5) * 0.2))
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [booking])

  useEffect(() => {
    if (!booking || booking.status === 'completed' || booking.status === 'cancelled') return

    const bookingChannel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'taxi_bookings', filter: `id=eq.${booking.id}` },
        (payload) => {
          setBooking(payload.new as TaxiBooking)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookingChannel)
    }
  }, [booking?.id, booking?.status])

  useEffect(() => {
    if (!booking) return

    const statusProgression: Record<string, { next: string; delay: number }> = {
      'searching': { next: 'driver_assigned', delay: 3000 },
      'driver_assigned': { next: 'driver_arriving', delay: 2000 },
      'driver_arriving': { next: 'arrived', delay: 8000 },
      'arrived': { next: 'in_progress', delay: 5000 },
      'in_progress': { next: 'completed', delay: 10000 },
    }

    const currentStatus = booking.status
    const progression = statusProgression[currentStatus]
    
    if (!progression) return

    const timer = setTimeout(async () => {
      const updates: Partial<TaxiBooking> = { status: progression.next as TaxiBooking['status'] }
      
      if (progression.next === 'driver_assigned') {
        updates.driver_name = DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)]
        updates.driver_phone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`
        updates.car_number = generateCarNumber()
        updates.car_model = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)]
        updates.driver_rating = Number((4 + Math.random() * 0.9).toFixed(1))
        updates.otp = generateOTP()
        updates.eta_minutes = Math.floor(3 + Math.random() * 5)
      }
      
      if (progression.next === 'driver_arriving' && booking.eta_minutes) {
        updates.eta_minutes = Math.max(1, booking.eta_minutes - 2)
      }
      
      if (progression.next === 'arrived') {
        updates.eta_minutes = 0
      }

      const { data, error } = await supabase
        .from('taxi_bookings')
        .update(updates)
        .eq('id', booking.id)
        .select()
        .single()

      if (!error && data) {
        setBooking(data as TaxiBooking)
      }
    }, progression.delay)

    return () => clearTimeout(timer)
  }, [booking])

  const handleBookRide = async () => {
    if (!selectedProvider || !pickup || !dropoff) return

    const provider = providers.find(p => p.id === selectedProvider)
    if (!provider) return

    setBookingLoading(true)

    const fare = calculateFare(provider)

    const { data, error } = await supabase
      .from('taxi_bookings')
      .insert({
        provider_id: selectedProvider,
        pickup_location: pickup,
        dropoff_location: dropoff,
        distance_km: distance,
        fare_amount: fare,
        status: 'searching'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
    } else {
      setBooking(data as TaxiBooking)
    }

    setBookingLoading(false)
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    await supabase
      .from('taxi_bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    setBooking(null)
    setSelectedProvider(null)
  }

  const getAvailabilityStatus = (cars: number) => {
    if (cars <= 3) return { label: 'HIGH DEMAND', color: 'bg-red-500/20 border-red-500/30 text-red-400', dotColor: 'bg-red-400' }
    if (cars <= 8) return { label: 'MODERATE', color: 'bg-amber-500/20 border-amber-500/30 text-amber-400', dotColor: 'bg-amber-400' }
    return { label: 'AVAILABLE', color: 'bg-green-500/20 border-green-500/30 text-green-400', dotColor: 'bg-green-400' }
  }

  const getSurgeStatus = (multiplier: number) => {
    if (multiplier >= 1.8) return { label: 'Peak Surge', color: 'text-red-400' }
    if (multiplier >= 1.3) return { label: 'Surge Active', color: 'text-amber-400' }
    return null
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'searching':
        return { label: 'Finding your driver...', icon: Loader2, color: 'text-amber-400', animate: true }
      case 'driver_assigned':
        return { label: 'Driver assigned!', icon: CheckCircle, color: 'text-green-400', animate: false }
      case 'driver_arriving':
        return { label: 'Driver is on the way', icon: Navigation2, color: 'text-blue-400', animate: true }
      case 'arrived':
        return { label: 'Driver has arrived', icon: MapPin, color: 'text-green-400', animate: false }
      case 'in_progress':
        return { label: 'Trip in progress', icon: Car, color: 'text-amber-400', animate: true }
      case 'completed':
        return { label: 'Trip completed', icon: CheckCircle, color: 'text-green-400', animate: false }
      default:
        return { label: 'Processing...', icon: Loader2, color: 'text-slate-400', animate: true }
    }
  }

  const sortedProviders = [...providers].sort((a, b) => calculateFare(a) - calculateFare(b))
  const cheapestProvider = sortedProviders[0]
  const selectedProviderData = providers.find(p => p.id === selectedProvider)

  if (booking && booking.status !== 'cancelled') {
    const statusConfig = getStatusConfig(booking.status)
    const StatusIcon = statusConfig.icon

    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        
        <main className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 text-white ${statusConfig.animate ? 'animate-spin' : ''}`} />
                    <span className="text-white font-semibold">{statusConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full">
                    <Radio className="w-3 h-3 text-white animate-pulse" />
                    <span className="text-white text-xs font-medium">LIVE</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
<div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 overflow-hidden">
                      {selectedProviderData?.name && PROVIDER_LOGOS[selectedProviderData.name] ? (
                        <img
                          src={PROVIDER_LOGOS[selectedProviderData.name]}
                          alt={selectedProviderData.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Car className="w-10 h-10 text-slate-800" />
                      )}
                    </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedProviderData?.name} Ride</h2>
                    <p className="text-slate-400">Booking #{booking.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Pickup</p>
                      <p className="text-white">{booking.pickup_location}</p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-dashed border-slate-700 h-4" />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Drop-off</p>
                      <p className="text-white">{booking.dropoff_location}</p>
                    </div>
                  </div>
                </div>

                {booking.driver_name && (
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">DRIVER DETAILS</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                          {booking.driver_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{booking.driver_name}</p>
                          <div className="flex items-center gap-1 text-amber-400 text-sm">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{booking.driver_rating}</span>
                          </div>
                        </div>
                      </div>
                      <a href={`tel:${booking.driver_phone}`} className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors">
                        <Phone className="w-5 h-5" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Car</p>
                        <p className="text-white text-sm font-medium">{booking.car_model}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Number</p>
                        <p className="text-white text-sm font-medium">{booking.car_number}</p>
                      </div>
                    </div>
                  </div>
                )}

                {booking.otp && booking.status !== 'completed' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400 text-sm font-medium">Ride OTP</span>
                    </div>
                    <p className="text-3xl font-bold text-white tracking-wider">{booking.otp}</p>
                    <p className="text-slate-400 text-sm mt-1">Share this with your driver to start the trip</p>
                  </div>
                )}

                {booking.eta_minutes !== null && booking.eta_minutes > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-medium">
                      {booking.status === 'driver_arriving' ? 'Arriving in' : 'ETA'}: {booking.eta_minutes} min
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div>
                    <p className="text-3xl font-bold text-white">₹{booking.fare_amount}</p>
                    <p className="text-slate-400 text-sm">{booking.distance_km} km</p>
                  </div>
                  {booking.status === 'completed' ? (
                    <Button 
                      onClick={() => { setBooking(null); setSelectedProvider(null) }}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
                    >
                      Book Another Ride
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCancelBooking}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Ride
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white font-serif">Airport Transfers</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-medium">LIVE PRICES</span>
              </div>
            </div>
            <p className="text-slate-400">Compare real-time prices from Uber, Ola, and Rapido</p>
          </div>

<div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative" ref={pickupRef}>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400 z-10" />
                  <Input
                    placeholder="Pickup: Airport Terminal"
                    value={pickup}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    onFocus={() => pickup.length >= 2 && setShowPickupSuggestions(pickupSuggestions.length > 0)}
                    className="pl-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  />
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      {pickupSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectPickupLocation(loc)}
                          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm truncate">{loc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative" ref={dropoffRef}>
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 z-10" />
                  <Input
                    placeholder="Drop-off: Hotel Address"
                    value={dropoff}
                    onChange={(e) => handleDropoffChange(e.target.value)}
                    onFocus={() => dropoff.length >= 2 && setShowDropoffSuggestions(dropoffSuggestions.length > 0)}
                    className="pl-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                  />
                  {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      {dropoffSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectDropoffLocation(loc)}
                          className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <Navigation className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className="text-sm truncate">{loc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm whitespace-nowrap">Distance:</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-white font-medium w-16">{distance} km</span>
                </div>
              </div>
            </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
              <p className="text-slate-400">Finding available cabs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sortedProviders.map((provider) => {
                const fare = calculateFare(provider)
                const availability = getAvailabilityStatus(provider.available_cars)
                const surge = getSurgeStatus(Number(provider.surge_multiplier))
                const isCheapest = provider.id === cheapestProvider?.id
                const isSelected = selectedProvider === provider.id

                return (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      isSelected 
                        ? 'border-amber-500 shadow-amber-500/20' 
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    {isCheapest && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold text-center py-1">
                        CHEAPEST OPTION
                      </div>
                    )}

                    <div className={`p-6 ${isCheapest ? 'pt-10' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
<div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-700">
                              {PROVIDER_LOGOS[provider.name] ? (
                                <img
                                  src={PROVIDER_LOGOS[provider.name]}
                                  alt={provider.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Car className="w-8 h-8 text-slate-400" />
                              )}
                            </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{provider.name}</h3>
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-sm">{provider.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${availability.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${availability.dotColor} animate-pulse`} />
                          <span className="text-xs font-medium">{availability.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                          <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-white">{provider.eta_minutes}</p>
                          <p className="text-xs text-slate-500">min away</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                          <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-white">{provider.available_cars}</p>
                          <p className="text-xs text-slate-500">cars nearby</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                          <TrendingUp className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className={`text-lg font-bold ${Number(provider.surge_multiplier) > 1.2 ? 'text-amber-400' : 'text-white'}`}>
                            {Number(provider.surge_multiplier).toFixed(1)}x
                          </p>
                          <p className="text-xs text-slate-500">surge</p>
                        </div>
                      </div>

                      {surge && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className={`text-sm font-medium ${surge.color}`}>{surge.label}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(provider.car_types as string[])?.slice(0, 3).map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="bg-slate-700/50 text-slate-300 text-xs"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-3xl font-bold text-white">₹{fare}</p>
                          <p className="text-slate-400 text-sm">for {distance} km</p>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isSelected && pickup && dropoff) {
                              handleBookRide()
                            } else {
                              setSelectedProvider(provider.id)
                            }
                          }}
                          disabled={bookingLoading || (isSelected && (!pickup || !dropoff))}
                          className={`font-semibold ${
                            isSelected 
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-500 hover:to-orange-600'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          {bookingLoading && isSelected ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSelected ? (
                            pickup && dropoff ? 'Book Now' : 'Enter Locations'
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-center text-slate-500 text-sm">
              Prices update every 5 seconds based on real-time demand. Actual fares may vary.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
