import { supabase } from '@/lib/supabase'
import type { Flight, Hotel } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { SearchForm } from '@/components/SearchForm'
import { FlightCard } from '@/components/FlightCard'
import { HotelCard } from '@/components/HotelCard'
import { Recommendations } from '@/components/Recommendations'
import { Plane, Building2, Shield, Clock, CreditCard, Headphones } from 'lucide-react'
import Link from 'next/link'

async function getFeaturedFlights(): Promise<Flight[]> {
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .order('price', { ascending: true })
    .limit(3)
  
  if (error) {
    console.error('Error fetching flights:', error)
    return []
  }
  return data || []
}

async function getFeaturedHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .order('rating', { ascending: false })
    .limit(3)
  
  if (error) {
    console.error('Error fetching hotels:', error)
    return []
  }
  return data || []
}

export default async function HomePage() {
  const [flights, hotels] = await Promise.all([
    getFeaturedFlights(),
    getFeaturedHotels(),
  ])

  const features = [
    { icon: Shield, title: 'Secure Booking', description: 'Your payments are protected with industry-standard encryption' },
    { icon: Clock, title: '24/7 Support', description: 'Our team is available around the clock to assist you' },
    { icon: CreditCard, title: 'Best Prices', description: 'We guarantee the lowest prices on flights and hotels' },
    { icon: Headphones, title: 'Easy Cancellation', description: 'Flexible booking with hassle-free cancellation policies' },
  ]

  const destinations = [
    { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600', flights: 156, hotels: 89 },
    { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600', flights: 98, hotels: 67 },
    { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600', flights: 134, hotels: 78 },
    { name: 'Miami', image: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600', flights: 87, hotels: 54 },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif">
              Explore the <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">World</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Book your next adventure with confidence. Discover amazing flights and hotels at unbeatable prices.
            </p>
          </div>
          
          <SearchForm />
          
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            <div className="flex items-center gap-3 text-slate-400">
              <Plane className="w-5 h-5 text-amber-400" />
              <span>500+ Airlines</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>100,000+ Hotels</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white font-serif mb-2">Featured Flights</h2>
                    <p className="text-slate-400">Discover our best flight deals</p>
                  </div>
                  <Link href="/flights" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    View all flights →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {flights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-1">
                <Recommendations />
              </div>
            </div>
          </div>
        </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white font-serif mb-2">Top-Rated Hotels</h2>
              <p className="text-slate-400">Handpicked accommodations for your stay</p>
            </div>
            <Link href="/hotels" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              View all hotels →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white font-serif mb-4">Popular Destinations</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Explore trending destinations loved by travelers worldwide</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.name}
                href={`/hotels?city=${dest.name}`}
                className="group relative h-80 rounded-2xl overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${dest.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{dest.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <span>{dest.flights} Flights</span>
                    <span>•</span>
                    <span>{dest.hotels} Hotels</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white font-serif mb-4">Why Choose TravelBook?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We make travel booking simple, secure, and affordable</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-amber-500/50 transition-colors">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-slate-950" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-slate-950" />
                </div>
                <span className="text-xl font-bold text-white">TravelBook</span>
              </div>
              <p className="text-slate-400 text-sm">Your ultimate travel companion for booking flights and hotels worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/flights" className="hover:text-amber-400 transition-colors">Flights</Link></li>
                <li><Link href="/hotels" className="hover:text-amber-400 transition-colors">Hotels</Link></li>
                <li><Link href="/profile" className="hover:text-amber-400 transition-colors">My Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Help Center</span></li>
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Contact Us</span></li>
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">FAQs</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Cookie Policy</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} TravelBook. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
