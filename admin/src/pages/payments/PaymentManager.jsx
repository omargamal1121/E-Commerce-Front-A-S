import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { backendUrl, currency } from "../../App";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const PaymentManager = ({ token }) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all"); // all, cod, paid, unpaid
  
  // Modal states
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        pageSize: itemsPerPage,
      };

      const resp = await axios.get(`${backendUrl}/api/Payment`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = resp.data?.responseBody?.data || [];
      const total = resp.data?.responseBody?.totalCount || resp.data?.totalCount || 0;

      console.log('Fetched payments:', data);
      console.log('Total count:', total);
      
      setPayments(data);
      setTotalCount(total);
    } catch (error) {
      if (error.response?.status === 404) {
        setPayments([]);
        setTotalCount(0);
      } else {
        toast.error("Failed to load payments");
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, filterStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleMarkAsPaid = async () => {
    setMarkingPaid(true);
    try {
      const response = await axios.put(
        `${backendUrl}/api/payment/cash-on-delivery/pay`,
        {
          paymentId: selectedPayment.id,
          transactionId: null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 200) {
        toast.success("Payment marked as paid successfully");
        setShowMarkPaidModal(false);
        setSelectedPayment(null);
        fetchPayments(); // Refresh payment list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark payment as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  const openMarkPaidModal = (payment) => {
    setSelectedPayment(payment);
    setShowMarkPaidModal(true);
  };

  const closeMarkPaidModal = () => {
    setShowMarkPaidModal(false);
    setSelectedPayment(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'failed':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'cancelled':
        return 'bg-gray-50 text-gray-600 border-gray-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const isCashOnDelivery = (payment) => {
    // Debug: log payment data to understand structure
    console.log('Payment data:', payment);
    
    // Based on actual API response: paymentMethodId: 2, paymentMethod: "Cash On Delivery"
    const method = payment?.paymentMethod?.toLowerCase() || '';
    const methodName = payment?.methodName?.toLowerCase() || '';
    const methodId = payment?.paymentMethodId;
    
    return method.includes('cash') || 
           method.includes('cod') || 
           method === 'cash on delivery' ||
           methodName.includes('cash') || 
           methodName.includes('cod') ||
           methodId === 2; // Based on actual API response - COD has paymentMethodId: 2
  };

  const canMarkAsPaid = (payment) => {
    const isCOD = isCashOnDelivery(payment);
    const isNotPaid = payment?.status?.toLowerCase() !== 'paid';
    console.log(`Payment #${payment.id}: COD=${isCOD}, NotPaid=${isNotPaid}, CanMark=${isCOD && isNotPaid}`);
    return isCOD && isNotPaid;
  };

  // Filter payments based on selected filter
  const getFilteredPayments = () => {
    switch (filterStatus) {
      case 'cod':
        return payments.filter(isCashOnDelivery);
      case 'paid':
        return payments.filter(p => p?.status?.toLowerCase() === 'paid');
      case 'unpaid':
        return payments.filter(p => p?.status?.toLowerCase() !== 'paid');
      default:
        return payments;
    }
  };

  const filteredPayments = getFilteredPayments();

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('paymentManagement')}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t('paymentManagementSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm focus:ring-4 focus:ring-blue-50 outline-none cursor-pointer"
          >
            <option value="all">{t('allPayments')}</option>
            <option value="cod">{t('cashOnDelivery')}</option>
            <option value="paid">{t('paid')}</option>
            <option value="unpaid">{t('unpaid')}</option>
          </select>
          <button
            onClick={fetchPayments}
            className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">{t('noPaymentsFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Order</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Method</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <span className="text-sm font-bold text-gray-900">#{payment.id}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-bold text-gray-700">
                        {payment.orderNumber || `Order #${payment.orderId}`}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">
                          {payment.paymentMethod || payment.methodName || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ID: {payment.paymentMethodId || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-lg font-black text-gray-900">
                        {currency} {(payment.amount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadgeClass(payment.status)}`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-medium text-gray-600">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {canMarkAsPaid(payment) && (
                        <button
                          onClick={() => openMarkPaidModal(payment)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                        >
                          {t('markAsPaid')}
                        </button>
                      )}
                      {!canMarkAsPaid(payment) && (
                        <span className="text-[10px] text-gray-400">
                          {isCashOnDelivery(payment) ? 'Already Paid' : 'Not COD'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {t('previous')}
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {t('next')}
          </button>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                {t('markAsPaid')}
              </h3>
              <button 
                onClick={closeMarkPaidModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  {t('paymentDetails')}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{t('paymentId')}</span>
                  <span className="text-sm font-bold text-gray-900">#{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-600">{t('amount')}</span>
                  <span className="text-lg font-black text-gray-900">
                    {currency} {(selectedPayment.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={closeMarkPaidModal}
                  disabled={markingPaid}
                  className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  {markingPaid ? t('processing') : t('confirmPayment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;