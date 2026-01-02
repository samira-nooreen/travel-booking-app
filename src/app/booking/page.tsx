"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plane, Building2, Users, Mail, Phone, User, CreditCard, Check, ArrowLeft, ArrowRight, Calendar, Clock, MapPin } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookingStore, useAuthStore } from '@/lib/store'
import { supabase, type Flight, type Hotel } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime, formatDuration, calculateNights } from '@/lib/utils'
import { toast } from 'sonner'

type BookingStep = 'details' | 'passengers' | 'payment' | 'confirmation'

interface PassengerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export default function BookingPage() {
  const router = useRouter()
  const { currentBooking, clearBooking } = useBookingStore()
  const { user } = useAuthStore()
  
  const [step, setStep] = useState<BookingStep>('details')
  const [loading, setLoading] = useState(false)
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    { firstName: '', lastName: '', email: user?.email || '', phone: '' }
  ])
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentBooking || !user) {
      router.push('/')
    }
  }, [currentBooking, user, router])

  if (!currentBooking || !user) {
    return null
  }

  const isFlight = currentBooking.type === 'flight'
  const item = currentBooking.item as Flight | Hotel
  
  const calculateTotal = () => {
    if (isFlight) {
      return (item as Flight).price * currentBooking.guests
    } else {
      const nights = calculateNights(currentBooking.checkIn!, currentBooking.checkOut!)
      return (item as Hotel).price_per_night * nights * 1.12
    }
  }

  const total = calculateTotal()

  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }
    setPassengers(updated)
  }

  const addPassenger = () => {
    if (passengers.length < currentBooking.guests) {
      setPassengers([...passengers, { firstName: '', lastName: '', email: '', phone: '' }])
    }
  }

  const handleConfirmBooking = async () => {
    setLoading(true)

    try {
      const bookingData = {
        user_id: user.id,
        booking_type: currentBooking.type,
        flight_id: isFlight ? item.id : null,
        hotel_id: !isFlight ? item.id : null,
        check_in_date: currentBooking.checkIn || null,
        check_out_date: currentBooking.checkOut || null,
        guests: currentBooking.guests,
        total_price: total,
        status: 'confirmed' as const,
        passenger_details: { passengers },
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (error) {
        toast.error('Failed to create booking')
        setLoading(false)
        return
      }

      await supabase.from('payments').insert({
        booking_id: data.id,
        amount: total,
        currency: 'USD',
        payment_method: 'card',
        status: 'completed',
      })

      setBookingId(data.id)
      setStep('confirmation')
      toast.success('Booking confirmed!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 'details', label: 'Review Details' },
    { id: 'passengers', label: 'Passenger Info' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirmation' },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === step)

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white font-serif mb-2">Complete Your Booking</h1>
            <p className="text-slate-400">
              {isFlight ? 'Flight' : 'Hotel'} booking for {currentBooking.guests} {currentBooking.guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>

          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  i <= currentStepIndex
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800/50 text-slate-500'
                }`}>
                  {i < currentStepIndex ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{i + 1}</span>
                  )}
                  <span className="font-medium text-sm whitespace-nowrap">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${
                    i < currentStepIndex ? 'bg-amber-500/50' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'details' && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Booking Summary</h2>
                  
                  <div className="flex gap-4 mb-6">
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={isFlight
                          ? (item as Flight).image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400'
                          : (item as Hotel).image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
                        }
                        alt={isFlight ? (item as Flight).airline : (item as Hotel).name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      {isFlight ? (
                        <>
                          <div className="flex items-center gap-2 text-white mb-1">
                            <Plane className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold">{(item as Flight).airline}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300">{(item as Flight).flight_number}</span>
                          </div>
                          <p className="text-slate-400 text-sm">
                            {(item as Flight).departure_city} → {(item as Flight).arrival_city}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {formatDate((item as Flight).departure_time)} • {formatTime((item as Flight).departure_time)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-white mb-1">
                            <Building2 className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold">{(item as Hotel).name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-sm mb-1">
                            <MapPin className="w-3 h-3" />
                            {(item as Hotel).city}, {(item as Hotel).country}
                          </div>
                          <p className="text-slate-400 text-sm">
                            {formatDate(currentBooking.checkIn!)} - {formatDate(currentBooking.checkOut!)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {isFlight && (
                    <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{(item as Flight).departure_airport}</p>
                          <p className="text-amber-400 font-medium">{formatTime((item as Flight).departure_time)}</p>
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-amber-500/50" />
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              <Clock className="w-3 h-3" />
                              {formatDuration((item as Flight).departure_time, (item as Flight).arrival_time)}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-slate-700" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{(item as Flight).arrival_airport}</p>
                          <p className="text-amber-400 font-medium">{formatTime((item as Flight).arrival_time)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isFlight && (
                    <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 text-sm">Check-in</p>
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span className="font-medium">{formatDate(currentBooking.checkIn!)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Check-out</p>
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <span className="font-medium">{formatDate(currentBooking.checkOut!)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{currentBooking.guests} {currentBooking.guests === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>
              )}

              {step === 'passengers' && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Passenger Information</h2>
                  
                  <div className="space-y-6">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="p-4 bg-slate-900/50 rounded-xl">
                        <h3 className="text-white font-medium mb-4">Passenger {index + 1}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">First Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                placeholder="First name"
                                value={passenger.firstName}
                                onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">Last Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                placeholder="Last name"
                                value={passenger.lastName}
                                onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                type="email"
                                placeholder="Email address"
                                value={passenger.email}
                                onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">Phone</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                type="tel"
                                placeholder="Phone number"
                                value={passenger.phone}
                                onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {passengers.length < currentBooking.guests && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPassenger}
                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Add Another Passenger
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Payment Details</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Card Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          placeholder="4242 4242 4242 4242"
                          className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-sm">Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-400 text-sm">CVC</Label>
                        <Input
                          placeholder="123"
                          className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Cardholder Name</Label>
                      <Input
                        placeholder="Name on card"
                        className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-amber-400 text-sm">
                      This is a demo. No actual payment will be processed.
                    </p>
                  </div>
                </div>
              )}

              {step === 'confirmation' && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
                  <p className="text-slate-400 mb-6">
                    Your booking has been successfully confirmed. Confirmation details have been sent to your email.
                  </p>
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                    <p className="text-slate-400 text-sm">Booking Reference</p>
                    <p className="text-2xl font-bold text-amber-400">{bookingId?.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => {
                        clearBooking()
                        router.push('/profile')
                      }}
                      className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
                    >
                      View My Bookings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearBooking()
                        router.push('/')
                      }}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              )}

              {step !== 'confirmation' && (
                <div className="flex gap-4 mt-6">
                  {step !== 'details' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const prevStep = steps[currentStepIndex - 1]
                        if (prevStep) setStep(prevStep.id as BookingStep)
                      }}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (step === 'payment') {
                        handleConfirmBooking()
                      } else {
                        const nextStep = steps[currentStepIndex + 1]
                        if (nextStep) setStep(nextStep.id as BookingStep)
                      }
                    }}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600"
                  >
                    {loading ? 'Processing...' : step === 'payment' ? 'Confirm & Pay' : 'Continue'}
                    {!loading && step !== 'payment' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              )}
            </div>

            {step !== 'confirmation' && (
              <div className="lg:col-span-1">
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-white mb-4">Price Summary</h3>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b border-slate-700/50">
                    {isFlight ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Base fare × {currentBooking.guests}</span>
                          <span className="text-white">{formatCurrency((item as Flight).price * currentBooking.guests * 0.85)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Taxes & fees</span>
                          <span className="text-white">{formatCurrency((item as Flight).price * currentBooking.guests * 0.15)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">
                            {formatCurrency((item as Hotel).price_per_night)} × {calculateNights(currentBooking.checkIn!, currentBooking.checkOut!)} nights
                          </span>
                          <span className="text-white">
                            {formatCurrency((item as Hotel).price_per_night * calculateNights(currentBooking.checkIn!, currentBooking.checkOut!))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Taxes & fees (12%)</span>
                          <span className="text-white">
                            {formatCurrency((item as Hotel).price_per_night * calculateNights(currentBooking.checkIn!, currentBooking.checkOut!) * 0.12)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400 text-xl">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
