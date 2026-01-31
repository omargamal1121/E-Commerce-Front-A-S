import React from "react";

const DiscountForm = ({
  formData,
  handleInputChange,
  handleSubmitDiscount,
  resetForm,
  editMode,
  discountLoading,
}) => {
  return (
    <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-purple-500 rounded-full" />
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Campaign Forge</h3>
        </div>
        {editMode && (
          <button onClick={resetForm} className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-6 py-2 rounded-full hover:bg-rose-500 hover:text-white transition-all">Abort Update</button>
        )}
      </div>

      <form onSubmit={handleSubmitDiscount} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Campaign nomenclature</label>
            <input
              name="name" value={formData.name} onChange={handleInputChange} required
              className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-8 py-4 outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 transition-all font-bold text-lg"
              placeholder="Summer Matrix 2026..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Descriptive Metadata</label>
            <textarea
              name="description" value={formData.description} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-8 py-6 outline-none focus:ring-8 focus:ring-purple-50 focus:border-purple-300 transition-all font-medium text-gray-600 min-h-[150px]"
              placeholder="Strategic campaign objectives and parameters..."
            />
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col gap-6 shadow-2xl shadow-purple-900/20">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Yield Configuration</h4>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Magnitude (%)</label>
              <div className="relative">
                <input
                  name="discountPercent" type="number" value={formData.discountPercent} onChange={handleInputChange} required min="1" max="100"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-purple-500 font-black text-3xl tracking-tighter"
                  placeholder="00"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-purple-500">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Protocol Start</label>
                <input
                  name="startDate" type="datetime-local" value={formData.startDate} onChange={handleInputChange} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Protocol Expire</label>
                <input
                  name="endDate" type="datetime-local" value={formData.endDate} onChange={handleInputChange} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={discountLoading}
              className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-900/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {discountLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {editMode ? "Sync Matrix" : "Commit Protocol"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiscountForm;
