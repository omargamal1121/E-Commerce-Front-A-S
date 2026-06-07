import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'

const Dashboard = ({ token }) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const STATUS_LABELS = {
    0: 'PendingPayment',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Shipped',
    4: 'Delivered',
    5: 'CancelledByUser',
    6: 'Refunded',
    7: 'Returned',
    8: 'PaymentExpired',
    9: 'CancelledByAdmin',
    10: 'Complete',
  }

  const normalizeStatus = (s) => {
    if (Number.isFinite(s)) return STATUS_LABELS[s] || String(s)
    const str = String(s || '').trim()
    const match = Object.values(STATUS_LABELS).find((v) => v.toLowerCase() === str.toLowerCase())
    return match || str || 'PendingPayment'
  }

  const countAllFromEndpoint = async (path, baseParams = {}) => {
    try {
      const resp = await axios.get(`${backendUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...baseParams },
      })
      return resp?.data?.responseBody?.data || 0
    } catch (err) {
      console.error(`Error counting ${path}:`, err)
      return 0
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const fetchRevenue = async () => {
        try {
          const res = await axios.get(`${backendUrl}/api/Order/revenue`, { headers: { Authorization: `Bearer ${token}` } });
          return res.data?.responseBody?.data ?? 0;
        } catch (err) {
          if (err.response?.status === 404) return 0;
          throw err;
        }
      };

      const [totalProducts, totalOrders, pendingOrders, totalRevenue] = await Promise.all([
        countAllFromEndpoint('/api/Products/Count', { isActive: true, isDelete: false, inStock: true }),
        countAllFromEndpoint('/api/Order/Count', {}),
        countAllFromEndpoint('/api/Order/Count', { status: 1 }), // Keeping consistent with "Pending" meaning confirmed/needs action
        fetchRevenue()
      ])

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders
      })

      let ordersList = [];
      try {
        const ordersListResp = await axios.get(`${backendUrl}/api/Order`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, pageSize: 5, sortBy: 'createdAt', sortDescending: true }
        })
        ordersList = Array.isArray(ordersListResp?.data?.responseBody?.data)
          ? ordersListResp.data.responseBody.data
          : []
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error loading recent orders:", err);
        }
      }
      setRecentOrders(ordersList)

      let popular = [];
      try {
        const bestSellersResp = await axios.get(`${backendUrl}/api/Products/bestsellers`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, pageSize: 10 }
        })
        popular = (bestSellersResp.data?.responseBody?.data || []).map(p => ({
          id: p.id,
          name: p.name,
          soldCount: p.totalSold ?? p.totalsold ?? 0,
          price: p.finalPrice ?? p.price,
          image: (p.images?.find(img => img.isMain) || p.images?.[0])?.url || null,
          discountStatus: p.discountStatus
        }));
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error loading best sellers:", err);
        }
      }
      setPopularProducts(popular)

    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchDashboardData() }, [token])

  return (
    <div className="max-w-[1600px] mx-auto p-6 flex flex-col gap-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Intelligence Dashboard</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Real-time Performance & Operations Meta</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200">System Live</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-[32px]" />)}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Products', val: stats.totalProducts, icon: '📦', colorKey: 'blue',    link: '/products' },
              { label: 'Total Orders',   val: stats.totalOrders,   icon: '🛍️', colorKey: 'emerald', link: '/orders' },
              { label: 'Total Revenue',  val: `${currency}${stats.totalRevenue.toFixed(2)}`, icon: '💰', colorKey: 'amber' },
              { label: 'Pending Orders', val: stats.pendingOrders, icon: '⏳', colorKey: 'rose',    link: '/orders?status=1' }
            ].map((s) => {
              // Static class map — dynamic interpolation like `bg-${color}-50` gets purged in production
              const colorClasses = {
                blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    hover: 'group-hover:bg-blue-600' },
                emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'group-hover:bg-emerald-600' },
                amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   hover: 'group-hover:bg-amber-600' },
                rose:    { bg: 'bg-rose-50',    border: 'border-rose-100',    hover: 'group-hover:bg-rose-600' },
              }[s.colorKey];
              return (
                <button
                  key={s.label}
                  onClick={() => s.link && navigate(s.link)}
                  disabled={!s.link}
                  className={`group p-8 rounded-[40px] border border-gray-100 bg-white transition-all text-left flex flex-col gap-4 ${s.link ? 'hover:shadow-2xl hover:shadow-gray-200 hover:-translate-y-2 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center text-2xl ${colorClasses.border} border transition-colors ${colorClasses.hover} group-hover:text-white`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight mt-1">{s.val}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Recent Orders Section */}
            <div className="xl:col-span-8 bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 flex items-center justify-between border-b border-gray-50">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Recent Orders</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Latest system transactions</p>
                </div>
                <button onClick={() => navigate('/orders')} className="px-8 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">View All</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Order</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                      <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(order => (
                      <tr key={order.id} onClick={() => navigate(`/orders/view/${order.orderNumber}`)} className="group hover:bg-gray-50/30 transition-colors cursor-pointer">
                        <td className="px-10 py-6">
                          <span className="text-sm font-black text-gray-900 uppercase">#{String(order.orderNumber || order.id).slice(-6)}</span>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-sm font-bold text-gray-700">{order.customerName || 'Guest'}</span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-lg font-black text-gray-900 tracking-tighter">{currency}{Number(order.total || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                            {normalizeStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Products Section */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="bg-gray-900 rounded-[48px] p-10 shadow-2xl shadow-blue-900/10 text-white flex flex-col gap-8 h-full">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Bestsellers</h3>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Top performing assets</p>
                </div>

                <div className="flex flex-col gap-6">
                  {popularProducts.slice(0, 5).map(product => (
                    <button
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="flex items-center gap-4 group text-left"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 p-1 flex-shrink-0">
                        <img src={product.image} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight truncate">{product.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-blue-400 tracking-tighter">{currency}{Number(product.price || 0).toFixed(2)}</span>
                            {product.discountStatus !== null && product.discountStatus !== undefined && (
                              <span className={`text-[8px] font-black uppercase tracking-widest leading-none mt-1 ${product.discountStatus ? "text-amber-400" : "text-gray-500"}`}>
                                {product.discountStatus ? "ON DISCOUNT" : "DISCOUNT INACTIVE"}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{product.soldCount} Sold</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/products')}
                  className="mt-4 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                >
                  Enter Product Registry
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard