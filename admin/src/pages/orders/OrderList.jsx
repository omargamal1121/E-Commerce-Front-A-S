import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { backendUrl, currency } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const OrderList = ({ token }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const STATUS_LABELS = {
    0: 'Pending',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Shipped',
    4: 'Delivered',
    5: 'Cancelled (User)',
    6: 'Refunded',
    7: 'Returned',
    8: 'Expired',
    9: 'Cancelled (Admin)',
    10: 'Complete',
  };

  const getStatusBadgeClass = (status) => {
    const s = Number(status);
    if ([4, 10].includes(s)) return 'bg-green-50 text-green-600 border-green-100';
    if ([5, 9].includes(s)) return 'bg-rose-50 text-rose-600 border-rose-100';
    if ([1, 2, 3].includes(s)) return 'bg-blue-50 text-blue-600 border-blue-100';
    if ([6, 7].includes(s)) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-gray-50 text-gray-500 border-gray-100';
  };

  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        pageSize: itemsPerPage,
      };
      
      // Send status filter to server if selected
      if (statusFilter !== "") {
        params.status = Number(statusFilter);
      }
      
      // Handle search term if provided
      if (searchTerm) {
        params.searchTerm = searchTerm;
      }

      const resp = await axios.get(`${backendUrl}/api/Order`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const data = resp.data?.responseBody?.data || [];
      const total = resp.data?.responseBody?.totalCount || 0;
      setOrders(data);
      setTotalCount(total);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, statusFilter, searchTerm]);

  const queryParams = new URLSearchParams(window.location.search);
  const initialFilter = queryParams.get("filter");

  useEffect(() => {
    if (initialFilter === "active") {
      setStatusFilter(""); // Reset specific status filter
    }
  }, [initialFilter]);

  // Reset to page 1 when status filter or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const currentOrders = orders;

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
        <div className="relative w-full lg:max-w-md group">
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all text-sm font-medium shadow-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <button
            onClick={() => navigate('/orders/create')}
            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Details</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Amount</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="px-8 py-6"><div className="h-12 bg-gray-50 rounded-2xl w-full" /></td>
                </tr>
              ))
            ) : currentOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="font-black uppercase tracking-[0.2em] text-xs">No orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-gray-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">#{order.orderNumber}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-700">{order.customerName || "Anonymous Customer"}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">UID: {order.customerId || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeClass(order.status)} shadow-sm`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-gray-900 text-lg">{currency} {order.totalAmount?.toFixed(2) || order.total?.toFixed(2) || "0.00"}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Price</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => navigate(`/orders/view/${order.orderNumber}`)}
                      className="px-6 py-2.5 bg-gray-50 hover:bg-gray-900 text-gray-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-gray-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="inline-flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-full shadow-lg">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center px-4">
              <span className="text-sm font-black text-gray-900">{currentPage}</span>
              <span className="mx-2 text-gray-300 font-bold text-xs">/</span>
              <span className="text-sm font-bold text-gray-400">{totalPages}</span>
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-3 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;