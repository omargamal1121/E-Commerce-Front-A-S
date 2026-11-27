/**
 * Admin Promo Codes Management Page
 * Routes: /promo-codes (list), form is inline
 */
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { backendUrl } from "../../App";
import { useTranslation } from "react-i18next";

/* ── helpers ───────────────────────────────────────────────── */

/**
 * Safely parse a UTC date string from the backend.
 * Many .NET endpoints return ISO strings without a trailing 'Z' (e.g. "2026-11-26T10:00:00").
 * Without 'Z', JS Date() treats it as local browser time. This helper ensures it is always
 * treated as UTC so that timezone conversions to Africa/Cairo are accurate.
 */
const parseUtcDate = (utcString) => {
  if (!utcString) return null;
  let s = String(utcString).trim();
  if (!s) return null;
  // If it already has Z or timezone offset (+HH:mm or -HH:mm), parse directly
  if (s.endsWith("Z") || s.endsWith("z") || /[+-]\d{2}(:\d{2})?$/.test(s)) {
    return new Date(s);
  }
  // Otherwise, append Z so JavaScript parses it as UTC
  s = s.replace(" ", "T") + "Z";
  return new Date(s);
};

/** Convert UTC string from server → Africa/Cairo display string for table */
const toCairoDisplay = (utcString) => {
  const date = parseUtcDate(utcString);
  if (!date || isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return utcString;
  }
};

/** Convert UTC string from server → datetime-local input format (YYYY-MM-DDTHH:mm) in Africa/Cairo */
const toCairoInput = (utcString) => {
  const date = parseUtcDate(utcString);
  if (!date || isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date).replace(" ", "T").slice(0, 16);
  } catch {
    return "";
  }
};

/** Convert Africa/Cairo datetime-local input string → UTC ISO 8601 string */
const cairoLocalToUTC = (localString) => {
  if (!localString) return "";
  try {
    const [datePart, timePart] = localString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    // Target timestamp if the numbers were UTC
    const targetUtc = Date.UTC(year, month - 1, day, hours, minutes);
    const probe = new Date(targetUtc);

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(probe);
    const getPart = (type) => Number(parts.find((p) => p.type === type)?.value || 0);

    const cYear = getPart("year");
    const cMonth = getPart("month");
    const cDay = getPart("day");
    let cHour = getPart("hour");
    if (cHour === 24) cHour = 0;
    const cMinute = getPart("minute");

    const cairoAsUtc = Date.UTC(cYear, cMonth - 1, cDay, cHour, cMinute);
    const offsetMs = cairoAsUtc - targetUtc;

    return new Date(targetUtc - offsetMs).toISOString();
  } catch (e) {
    console.error("Error converting Cairo local to UTC:", e);
    return new Date(localString).toISOString();
  }
};

const STATUS_BADGE = {
  Active:   "bg-green-100  text-green-700  border-green-300",
  Upcoming: "bg-blue-100   text-blue-700   border-blue-300",
  Inactive: "bg-gray-100   text-gray-600   border-gray-300",
  Expired:  "bg-red-100    text-red-700    border-red-300",
};

const EMPTY_FORM = {
  code: "",
  discountPercent: "",
  startsAt: "",
  endsAt: "",
};

/* ═══════════════════════════════════════════════════════════ */

const PromoManager = ({ token }) => {
  const { t } = useTranslation();

  /* ── list state ── */
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  /* ── form state ── */
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  /* ── delete confirm ── */
  const [deletingId, setDeletingId] = useState(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  /* ── fetch list ── */
  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize, _t: Date.now() });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${backendUrl}/api/admin/promo-codes?${params}`, {
        headers: authHeader,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const body = data?.responseBody?.data ?? data?.data ?? {};
      const items = Array.isArray(body) ? body : (body.items ?? body.data ?? []);
      setPromos(items);
      const tp = body.totalPages ?? body.TotalPages ?? Math.ceil((body.totalCount ?? items.length) / pageSize);
      setTotalPages(tp || 1);
    } catch (e) {
      toast.error("Failed to load promo codes: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  /* ── open create form ── */
  const openCreate = () => {
    setEditingPromo(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  /* ── open edit form ── */
  const openEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code ?? "",
      discountPercent: String(promo.discountPercent ?? ""),
      startsAt: toCairoInput(promo.startsAt),
      endsAt: toCairoInput(promo.endsAt),
    });
    setShowForm(true);
  };

  /* ── generate random code ── */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/promo-codes/generate`, {
        headers: authHeader,
      });
      const data = await res.json();
      const code = data?.data ?? data?.responseBody?.data ?? data?.code ?? "";
      if (code) setForm((p) => ({ ...p, code: String(code).toUpperCase() }));
      else toast.error("Could not generate code.");
    } catch { toast.error("Error generating code."); }
    finally { setGenerating(false); }
  };

  /* ── submit create/edit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error("Code is required."); return; }
    if (!form.discountPercent || Number(form.discountPercent) <= 0 || Number(form.discountPercent) > 100) {
      toast.error("Discount percent must be between 0.01 and 100."); return;
    }
    if (!form.endsAt) { toast.error("End date is required."); return; }
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) {
      toast.error("End date must be after start date."); return;
    }

    setFormLoading(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountPercent: Number(form.discountPercent),
      startsAt: form.startsAt ? cairoLocalToUTC(form.startsAt) : undefined,
      endsAt: cairoLocalToUTC(form.endsAt),
    };

    try {
      let res;
      if (editingPromo) {
        res = await fetch(`${backendUrl}/api/admin/promo-codes/${editingPromo.id}`, {
          method: "PUT",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${backendUrl}/api/admin/promo-codes`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.responseBody?.message || data?.message || "Failed to save promo code.");
        return;
      }
      toast.success(editingPromo ? "Promo code updated." : "Promo code created.");
      setShowForm(false);
      fetchPromos();
    } catch { toast.error("Error saving promo code."); }
    finally { setFormLoading(false); }
  };

  /* ── activate / deactivate ── */
  const handleToggleActive = async (promo) => {
    const action = promo.isActive ? "deactivate" : "activate";
    try {
      const res = await fetch(`${backendUrl}/api/admin/promo-codes/${promo.id}/${action}`, {
        method: "PATCH",
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.responseBody?.message || data?.message || `Failed to ${action}.`;
        // Backend error on activating expired code → suggest edit
        toast.error(msg);
        if (action === "activate" && msg.toLowerCase().includes("expired")) {
          openEdit(promo);
        }
        return;
      }
      toast.success(`Promo code ${action}d.`);
      fetchPromos();
    } catch { toast.error(`Error: ${action} failed.`); }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/promo-codes/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.responseBody?.message || "Failed to delete.");
        return;
      }
      toast.success("Promo code deleted.");
      setDeletingId(null);
      fetchPromos();
    } catch { toast.error("Error deleting promo code."); }
  };

  /* ─── render ───────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">🏷️ Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage promotional discount codes.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow"
        >
          + New Promo Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by code…"
          value={search}
          onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase outline-none focus:border-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="">All Statuses</option>
          <option value="Active">🟢 Active</option>
          <option value="Upcoming">🔵 Upcoming</option>
          <option value="Inactive">⚫ Inactive</option>
          <option value="Expired">🔴 Expired</option>
        </select>
        <button
          onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
          className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Code", "Discount %", "Starts At (Cairo)", "Ends At (Cairo)", "Status", "Orders Used", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Loading…
                </td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-medium">No promo codes found.</td></tr>
              ) : promos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-gray-800 tracking-wider">{p.code}</td>
                  <td className="px-4 py-3 font-bold text-blue-700">{p.discountPercent}%</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{toCairoDisplay(p.startsAt)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{toCairoDisplay(p.endsAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${STATUS_BADGE[p.status] || STATUS_BADGE.Inactive}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-semibold">{p.ordersCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-2.5 py-1 text-xs font-bold border border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                      >Edit</button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-1 text-xs font-bold border rounded-lg transition-colors ${
                          p.isActive
                            ? "border-orange-400 text-orange-700 hover:bg-orange-50"
                            : "border-green-400 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="px-2.5 py-1 text-xs font-bold border border-red-400 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">
                ← Prev
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-black text-gray-800 text-lg">
                {editingPromo ? `✏️ Edit: ${editingPromo.code}` : "➕ New Promo Code"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
            </div>

            {/* Warning if code has been used */}
            {editingPromo && (editingPromo.ordersCount ?? 0) > 0 && (
              <div className="mx-6 mt-4 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold">
                ℹ️ This code has been used in {editingPromo.ordersCount} order{editingPromo.ordersCount > 1 ? "s" : ""}. The code text cannot be changed.
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code + Generate */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Promo Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_\-]/g, "").slice(0, 20);
                      setForm((p) => ({ ...p, code: v }));
                    }}
                    disabled={!!(editingPromo && (editingPromo.ordersCount ?? 0) > 0)}
                    placeholder="e.g. SUMMER25"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider outline-none focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  {!(editingPromo && (editingPromo.ordersCount ?? 0) > 0) && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {generating ? "…" : "🎲 Generate"}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">3–20 chars, A–Z, 0–9, _ or -</p>
              </div>

              {/* Discount Percent */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Discount Percent * (0.01 – 100)
                </label>
                <input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                  min="0.01" max="100" step="0.01"
                  placeholder="e.g. 25"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  required
                />
              </div>

              {/* Starts At */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Starts At (Africa/Cairo time)
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank for no auto-activation. Stored as UTC internally.</p>
              </div>

              {/* Ends At */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Ends At (Africa/Cairo time) *
                </label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Saving…" : editingPromo ? "Update Code" : "Create Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-black text-gray-800 mb-2">🗑️ Delete Promo Code?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Orders that already used this code will keep their discount record.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoManager;
