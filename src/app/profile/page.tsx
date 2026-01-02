"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Phone, Calendar, Plane, Building2, Clock, X, MapPin } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/lib/store'
import { supabase, type Booking } from '@/lib/supabase'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchBookings()
  }, [user, router])

  const fetchBookings = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(*),
        hotel:hotels(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) {
      toast.error('Failed to cancel booking')
    } else {
      toast.success('Booking cancelled')
      fetchBookings()
    }
  }

  if (!user) {
    return null
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    completed: 'bg-blue-500/20 text-blue-400',
  }

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 text-3xl font-bold">
                    {user.full_name.charAt(0)}
                  </div>
                  <h1 className="text-xl font-bold text-white">{user.full_name}</h1>
                  <Badge className={user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}>
                    {user.role === 'admin' ? 'Administrator' : 'Member'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member since {formatDate(user.created_at)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout()
                      router.push('/')
                    }}
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white font-serif mb-6">My Bookings</h2>

              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-800/50 p-1 rounded-xl mb-6">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg"
                  >
                    Active ({activeBookings.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg"
                  >
                    Past ({pastBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                  ) : activeBookings.length > 0 ? (
                    <div className="space-y-4">
                      {activeBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onCancel={handleCancelBooking}
                          statusColors={statusColors}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                      <p className="text-slate-400 mb-4">No active bookings</p>
                      <Link href="/">
                        <Button className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-500 hover:to-orange-600">
                          Book Your Next Trip
                        </Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                  ) : pastBookings.length > 0 ? (
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          statusColors={statusColors}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                      <p className="text-slate-400">No past bookings</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface BookingCardProps {
  booking: Booking
  onCancel?: (id: string) => void
  statusColors: Record<string, string>
}

function BookingCard({ booking, onCancel, statusColors }: BookingCardProps) {
  const isFlight = booking.booking_type === 'flight'

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFlight ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
            {isFlight ? (
              <Plane className="w-5 h-5 text-blue-400" />
            ) : (
              <Building2 className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {isFlight ? booking.flight?.airline : booking.hotel?.name}
            </h3>
            <p className="text-slate-400 text-sm">
              {isFlight
                ? `${booking.flight?.departure_city} → ${booking.flight?.arrival_city}`
                : booking.hotel?.city
              }
            </p>
          </div>
        </div>
        <Badge className={statusColors[booking.status]}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {isFlight ? (
          <>
            <div>
              <p className="text-slate-500 text-xs">Flight</p>
              <p className="text-slate-300 text-sm">{booking.flight?.flight_number}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Date</p>
              <p className="text-slate-300 text-sm">{formatDate(booking.flight?.departure_time || '')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Time</p>
              <p className="text-slate-300 text-sm">{formatTime(booking.flight?.departure_time || '')}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-slate-500 text-xs">Check-in</p>
              <p className="text-slate-300 text-sm">{formatDate(booking.check_in_date || '')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Check-out</p>
              <p className="text-slate-300 text-sm">{formatDate(booking.check_out_date || '')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Guests</p>
              <p className="text-slate-300 text-sm">{booking.guests}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div>
          <p className="text-slate-500 text-xs">Total Price</p>
          <p className="text-amber-400 font-semibold">{formatCurrency(booking.total_price)}</p>
        </div>
        {onCancel && (booking.status === 'confirmed' || booking.status === 'pending') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(booking.id)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
