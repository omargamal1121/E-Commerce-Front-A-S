import React from "react";
import { currency } from "../../App";

const DiscountList = ({
  discounts,
  loading,
  handleEditDiscount,
  handleDeleteDiscount,
  handleToggleActive,
  handleRestoreDiscount,
  handleCalculateDiscount,
  fetchDiscounts,
  currentPage,
  totalPages,
  handlePreviousPage,
  handleNextPage,
}) => {

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white rounded-[32px] animate-pulse border border-gray-100" />)}
    </div>
  );

  if (!discounts.length) return (
    <div className="bg-white p-20 rounded-[48px] border border-gray-100 text-center flex flex-col items-center gap-6">
      <div className="text-7xl opacity-20">🏷️</div>
      <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Campaign Registry Empty</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identity</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Magnitude</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Temporal Range</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Protocol Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {discounts.map((d) => (
              <tr key={d.id} className="group hover:bg-purple-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{d.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[200px]">{d.description || "No metadata provided"}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-purple-600 tracking-tighter">-{d.discountPercent}%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold text-gray-600">{new Date(d.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-[10px] font-bold text-gray-600">{new Date(d.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${d.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                    {d.isActive ? "Operational" : "Offline"}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(d.id, d.isActive)}
                      className={`p-3 rounded-2xl transition-all border ${d.isActive ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                      title={d.isActive ? "Deactivate" : "Activate"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                    <button
                      onClick={() => handleEditDiscount(d.id)}
                      className="p-3 bg-white hover:bg-gray-900 hover:text-white border border-gray-100 rounded-2xl transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    {handleDeleteDiscount && (
                      <button
                        onClick={() => handleDeleteDiscount(d.id)}
                        className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Command Bar */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-[30px] shadow-sm">
            <button
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
              className="p-4 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-400 hover:text-purple-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-3 px-2">
              <span className="text-sm font-black text-gray-900">{currentPage}</span>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">of</span>
              <span className="text-sm font-bold text-gray-400">{totalPages}</span>
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              className="p-4 rounded-full hover:bg-gray-100 disabled:opacity-20 transition-all text-gray-400 hover:text-purple-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountList;
