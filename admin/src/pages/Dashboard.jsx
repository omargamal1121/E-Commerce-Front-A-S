import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../App'
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

  // Status labels consistent with Orders
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
    // Try to match label directly
    const match = Object.values(STATUS_LABELS).find((v) => v.toLowerCase() === str.toLowerCase())
    return match || str || 'PendingPayment'
  }

  // Count all items from a paginated endpoint by iterating pages until fewer than pageSize are returned
  const countAllFromEndpoint = async (path, baseParams = {}) => {

    let total = 0
    
    try {
     
        const resp = await axios.get(`${backendUrl}${path}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { ...baseParams },
        })
        total = resp?.data?.responseBody?.data
      
      }
     catch (err) {
      console.error(`Error counting ${path}:`, err?.response?.data || err)
      throw err
    }
    return total
  }

  // Fetch dashboard data
const fetchDashboardData = async () => {
  setLoading(true)
  try {

    const [totalProducts, totalOrders, pendingOrders, revenueResp] = await Promise.all([
  countAllFromEndpoint('/api/Products/Count', { isActive: true, isDelete: false, inStock: true }),
  countAllFromEndpoint('/api/Order/Count', {}),
  countAllFromEndpoint('/api/Order/Count', { status: 1 }),
  axios.get(`${backendUrl}/api/Order/revenue`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {}
  })
])


    const totalProductsVal = totalProducts
    const totalOrdersVal = totalOrders
    const pendingOrdersval=pendingOrders
    const totalRevenueVal = revenueResp.data?.responseBody?.data ?? 0

    setStats(prev => ({
      ...prev,
      totalProducts: totalProductsVal,
      totalOrders: totalOrdersVal,
      totalRevenue: totalRevenueVal,
      pendingOrders:pendingOrdersval
    }))

    const ordersListResp = await axios.get(`${backendUrl}/api/Order`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    })
    const ordersList = Array.isArray(ordersListResp?.data?.responseBody?.data)
      ? ordersListResp.data.responseBody.data
      : []

    const recent = [...ordersList]
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: o.total,
        createdAt: o.createdAt,
        status: o.status
      }))
    setRecentOrders(recent)

    const bestSellersResp = await axios.get(`${backendUrl}/api/Products/bestsellers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10, isActive: null, includeDeleted: null }
    })
    const bestSellers = Array.isArray(bestSellersResp.data?.responseBody?.data)
      ? bestSellersResp.data.responseBody.data
      : []
    const popular = bestSellers.map(p => {
      const mainImage = (Array.isArray(p.images) && p.images.find(img => img.isMain)) ||
                        (Array.isArray(p.images) && p.images[0]) ||
                        {}
      return {
        id: p.id,
        name: p.name,
        soldCount: p.totalSold ?? 0, 
        price: p.finalPrice ?? p.price,
        image: mainImage.url || null
      }
    })
    setPopularProducts(popular)

  } catch (err) {
    console.error('Dashboard load error:', err?.response?.data || err)
    toast.error('Failed to load dashboard data')
  } finally {
    setLoading(false)
  }
}


useEffect(() => {
  if (token) {
    fetchDashboardData()
  }
}, [token])

  return (
    <div className="dashboard">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="text-sm text-gray-500">Overview</div>
      </div>

      {loading ? (
        <>
          {/* Skeletons for stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map((i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>

          <div className="p-4 bg-white rounded-lg shadow mb-8 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>

          <div className="p-4 bg-white rounded-lg shadow animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onClick={() => navigate('/products')} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow hover:shadow-md transition flex items-center gap-3 text-left">
              <div className="p-3 rounded-lg bg-blue-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2a1 1 0 011 1v1h6V3a1 1 0 011-1h2a1 1 0 011 1v1h1a1 1 0 011 1v3H1V5a1 1 0 011-1h1V3z" /><path fillRule="evenodd" d="M1 9h18v7a2 2 0 01-2 2H3a2 2 0 01-2-2V9zm5 2a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </div>
            </button>

            <button onClick={() => navigate('/orders')} className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow hover:shadow-md transition flex items-center gap-3 text-left">
              <div className="p-3 rounded-lg bg-emerald-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h1l1 9a2 2 0 002 2h6a2 2 0 002-2l1-9h1a1 1 0 100-2H3z" /><path d="M7 13a2 2 0 104 0H7z" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </div>
            </button>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v2h16V5a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v4a2 2 0 002 2h12a2 2 0 002-2V9zM6 12a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold">{currency}{stats.totalRevenue.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl shadow flex items-center gap-3">
              <div className="p-3 rounded-lg bg-rose-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v3H5a1 1 0 000 2h3v3a1 1 0 002 0V8h3a1 1 0 100-2h-3V3a1 1 0 00-1-1z" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Pending Orders</div>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-4 rounded-xl shadow mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                View all
              </button>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {recentOrders.map((order) => {
                      const label = normalizeStatus(order.status)
                      const badge = label === 'Delivered'
                        ? 'bg-green-100 text-green-700'
                        : label === 'Shipped'
                        ? 'bg-blue-100 text-blue-700'
                        : label === 'CancelledByUser' || label === 'CancelledByAdmin'
                        ? 'bg-rose-100 text-rose-700'
                        : label === 'Refunded' || label === 'Returned'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-yellow-100 text-yellow-700'
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-700">#{String(order.orderNumber || order.id).toString().slice(-6)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{order.customerName || 'Customer'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm font-semibold">{currency}{Number(order.total || 0).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent orders available.</p>
            )}
          </div>

          {/* Popular Products */}
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Popular Products</h3>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                View all
              </button>
            </div>
            {popularProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularProducts.map((product) => (
                  <button key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="border rounded-lg overflow-hidden flex hover:shadow-md transition text-left">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-50">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="p-3 flex-1">
                      <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                      <p className="text-gray-500 text-xs">Product</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-semibold">{currency}{Number(product.price || 0).toFixed(2)}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.soldCount} sold</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No popular products found.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard