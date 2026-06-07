import React, { useEffect } from "react";

/**
 * Reusable confirmation dialog — replaces window.confirm() everywhere.
 * Usage:
 *   <ConfirmModal
 *     isOpen={showConfirm}
 *     title="Delete Product"
 *     message="This action cannot be undone. Are you sure?"
 *     confirmLabel="Delete"       // default "Confirm"
 *     confirmVariant="danger"     // "danger" | "warning" | "primary" (default)
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
const ConfirmModal = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantMap = {
    danger:  { btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20",   icon: "🗑️",  iconBg: "bg-rose-50",  iconColor: "text-rose-600" },
    warning: { btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-900/20", icon: "⚠️",  iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    primary: { btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20",    icon: "❓",  iconBg: "bg-blue-50",  iconColor: "text-blue-600" },
  };
  const v = variantMap[confirmVariant] || variantMap.danger;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${v.iconBg} flex items-center justify-center text-3xl`}>
            {v.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 ${v.btn} text-white rounded-2xl text-sm font-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
