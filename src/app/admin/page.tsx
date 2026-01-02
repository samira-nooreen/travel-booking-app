"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/lib/store'
import { supabase, type Flight, type Hotel, type Booking, type Profile, type FlightStatus } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plane, Building2, Users, CreditCard, TrendingUp, Calendar, Check, X, AlertTriangle, Clock, MapPin, RefreshCw, Bell } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { FlightStatusBadge } from '@/components/FlightStatusBadge'
import { toast } from 'sonner'

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [flights, setFlights] = useState<Flight[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    const [flightsRes, hotelsRes, bookingsRes, usersRes] = await Promise.all([
      supabase.from('flights').select('*').order('created_at', { ascending: false }),
      supabase.from('hotels').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select(`*, flight:flights(*), hotel:hotels(*)`).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ])

    setFlights(flightsRes.data || [])
    setHotels(hotelsRes.data || [])
    setBookings(bookingsRes.data || [])
    setUsers(usersRes.data || [])
    setLoading(false)
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', bookingId)
    fetchData()
  }

  const updateFlightStatus = async (flightId: string, status: FlightStatus, delayMinutes?: number, delayReason?: string) => {
    const updates: Partial<Flight> = { status, updated_at: new Date().toISOString() }
    if (status === 'delayed' && delayMinutes) {
      updates.delay_minutes = delayMinutes
      updates.delay_reason = delayReason || 'Operational delay'
    } else if (status !== 'delayed') {
      updates.delay_minutes = 0
      updates.delay_reason = null
    }
    await supabase.from('flights').update(updates).eq('id', flightId)
    toast.success(`Flight status updated to ${status}`)
    fetchData()
  }

  const sendNotification = async (userId: string, type: string, title: string, message: string) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
    })
    toast.success('Notification sent')
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0)

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length

  const delayedFlights = flights.filter(f => f.status === 'delayed').length
  const cancelledFlights = flights.filter(f => f.status === 'cancelled').length

  const bookingsByType = [
    { name: 'Flights', value: bookings.filter(b => b.booking_type === 'flight').length, color: '#3b82f6' },
    { name: 'Hotels', value: bookings.filter(b => b.booking_type === 'hotel').length, color: '#f59e0b' },
  ]

  const flightStatusData = [
    { name: 'On Time', value: flights.filter(f => f.status === 'on_time').length, color: '#10b981' },
    { name: 'Delayed', value: delayedFlights, color: '#f59e0b' },
    { name: 'Cancelled', value: cancelledFlights, color: '#ef4444' },
    { name: 'Boarding', value: flights.filter(f => f.status === 'boarding').length, color: '#3b82f6' },
    { name: 'Departed', value: flights.filter(f => f.status === 'departed').length, color: '#8b5cf6' },
  ]

  const popularRoutes = flights.reduce((acc, flight) => {
    const route = `${flight.departure_city} → ${flight.arrival_city}`
    acc[route] = (acc[route] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topRoutes = Object.entries(popularRoutes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }))

  const revenueByMonth = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 28000 },
    { month: 'Jun', revenue: totalRevenue },
  ]

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    completed: 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white font-serif mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage flights, hotels, bookings, and users</p>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<CreditCard className="w-6 h-6" />}
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                color="amber"
              />
              <StatCard
                icon={<Calendar className="w-6 h-6" />}
                label="Total Bookings"
                value={bookings.length.toString()}
                color="blue"
              />
              <StatCard
                icon={<AlertTriangle className="w-6 h-6" />}
                label="Delayed Flights"
                value={delayedFlights.toString()}
                color="yellow"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Total Users"
                value={users.length.toString()}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Flight Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={flightStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {flightStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {flightStatusData.filter(e => e.value > 0).map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-400 text-xs">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Popular Routes</h3>
                <div className="space-y-3">
                  {topRoutes.map((route, index) => (
                    <div key={route.route} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-bold text-sm">#{index + 1}</span>
                        <span className="text-slate-300 text-sm">{route.route}</span>
                      </div>
                      <Badge className="bg-slate-700 text-slate-300">{route.count} flights</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="bg-slate-800/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg">
                Bookings
              </TabsTrigger>
              <TabsTrigger value="flights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg">
                Flights
              </TabsTrigger>
              <TabsTrigger value="hotels" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg">
                Hotels
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-500 data-[state=active]:text-slate-950 rounded-lg">
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${booking.booking_type === 'flight' ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                              {booking.booking_type === 'flight' ? (
                                <Plane className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Building2 className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white text-sm">
                              {booking.booking_type === 'flight' ? booking.flight?.airline : booking.hotel?.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {booking.booking_type === 'flight'
                                ? `${booking.flight?.departure_city} → ${booking.flight?.arrival_city}`
                                : booking.hotel?.city
                              }
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                            {formatDate(booking.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-amber-400 font-medium">
                            {formatCurrency(booking.total_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

              <TabsContent value="flights">
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Flight</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Route</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Gate</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {flights.map((flight) => (
                          <tr key={flight.id} className="hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                              <p className="text-white font-medium">{flight.airline}</p>
                              <p className="text-slate-400 text-sm">{flight.flight_number}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {flight.departure_city} → {flight.arrival_city}
                            </td>
                            <td className="px-6 py-4">
                              <FlightStatusBadge 
                                status={flight.status || 'on_time'} 
                                delayMinutes={flight.delay_minutes}
                                size="sm"
                              />
                            </td>
                            <td className="px-6 py-4 text-slate-300 text-sm">
                              {flight.gate || '—'}
                            </td>
                            <td className="px-6 py-4 text-amber-400 font-medium">
                              {formatCurrency(flight.price)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateFlightStatus(flight.id, 'on_time')}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                                  title="Mark On Time"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateFlightStatus(flight.id, 'delayed', 45, 'Weather conditions')}
                                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2"
                                  title="Mark Delayed"
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateFlightStatus(flight.id, 'boarding')}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                                  title="Mark Boarding"
                                >
                                  <Plane className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateFlightStatus(flight.id, 'cancelled')}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                                  title="Cancel Flight"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="hotels">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Hotel</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price/Night</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rooms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {hotels.map((hotel) => (
                        <tr key={hotel.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{hotel.name}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {hotel.city}, {hotel.country}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-amber-500/20 text-amber-400">{hotel.rating}</Badge>
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-medium">
                            {formatCurrency(hotel.price_per_night)}
                          </td>
                          <td className="px-6 py-4 text-slate-300">{hotel.rooms_available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-semibold text-sm">
                                {u.full_name.charAt(0)}
                              </div>
                              <span className="text-white font-medium">{u.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{u.email}</td>
                          <td className="px-6 py-4">
                            <Badge className={u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{formatDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'amber' | 'blue' | 'green' | 'yellow'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    amber: 'from-amber-400 to-orange-500',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
  }

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-slate-950 mb-4`}>
        {icon}
      </div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
