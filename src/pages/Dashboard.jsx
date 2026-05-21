import { useEffect, useState } from 'react'
import { Users, Briefcase, MapPin, Heart, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { usersAPI, tripsAPI, destinationsAPI, wishlistsAPI } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, trips: 0, destinations: 0, wishlists: 0 })
  const [recentTrips, setRecentTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      usersAPI.getAll({ limit: 1 }),
      tripsAPI.getAll({ limit: 5 }),
      destinationsAPI.getAll(),
      wishlistsAPI.getAll(),
    ])
      .then(([usersRes, tripsRes, destRes, wishRes]) => {
        setStats({
          users: usersRes.data.total || 0,
          trips: tripsRes.data.total || 0,
          destinations: destRes.data.count || 0,
          wishlists: wishRes.data.count || 0,
        })
        setRecentTrips(tripsRes.data.trips || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Users',   value: stats.users,        change: '+12%', trend: 'up',   icon: Users,    color: 'bg-blue-500'    },
    { label: 'Active Trips',  value: stats.trips,        change: '+8%',  trend: 'up',   icon: Briefcase, color: 'bg-primary-500' },
    { label: 'Destinations',  value: stats.destinations, change: '+5%',  trend: 'up',   icon: MapPin,   color: 'bg-amber-500'   },
    { label: 'Wishlists',     value: stats.wishlists,    change: '+3%',  trend: 'up',   icon: Heart,    color: 'bg-rose-500'    },
  ]

  const getStatusColor = (status) => {
    if (status === 'Confirmed') return 'bg-green-100 text-green-700'
    if (status === 'Pending')   return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your travel app.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.change}
                  {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</h3>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Trips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Recent Bookings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Booking ID', 'User', 'Trip', 'Dates', 'Amount', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No trips yet</td>
                </tr>
              ) : recentTrips.map((trip) => (
                <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">{trip.bookingId}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{trip.user?.name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{trip.tripName}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">
                    ₹{trip.amount?.toLocaleString() || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
