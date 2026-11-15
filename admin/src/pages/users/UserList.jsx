import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10;

// ─── Small helper badge ───────────────────────────────────────────────────────
const RoleBadge = ({ role, onRemove, removing, disabled, isSuperAdminRole }) => {
  const r = String(role).toLowerCase();
  const isSuperAdmin = r === 'superadmin' || r === 'super admin' || isSuperAdminRole;
  const colorMap = {
    superadmin: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    admin:      'bg-purple-100 text-purple-800 border-purple-200',
    delivery:   'bg-amber-100 text-amber-800 border-amber-200',
  };
  const color = colorMap[r] || 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${color}`}>
      {role}
      {isSuperAdmin ? (
        <span
          title="The SuperAdmin role cannot be removed."
          className="ml-0.5 text-gray-400 cursor-not-allowed text-[10px]"
          aria-label="The SuperAdmin role cannot be removed."
        >
          🔒
        </span>
      ) : (
        onRemove && (
          <button
            type="button"
            disabled={removing || disabled}
            onClick={onRemove}
            title={disabled ? 'Action not allowed' : `Remove ${role} role`}
            aria-label={`Remove ${role} role`}
            className="ml-0.5 text-current opacity-60 hover:opacity-100 disabled:opacity-30 leading-none cursor-pointer disabled:cursor-not-allowed"
          >
            {removing ? '…' : '×'}
          </button>
        )
      )}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const UserList = ({ token }) => {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 'all' | 'active' | 'locked' | 'deleted'
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [availableRoles, setAvailableRoles] = useState(['admin', 'user', 'delivery'])

  // Per-row loading states
  const [deletingId,   setDeletingId]   = useState(null)
  const [lockingId,    setLockingId]    = useState(null)
  const [unlockingId,  setUnlockingId]  = useState(null)
  const [removingRole, setRemovingRole] = useState(null) // "userId:role"
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  // Detail modal
  const [viewOpen,    setViewOpen]    = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleInput, setRoleInput] = useState('')

  // Confirmation modal
  const [confirmState, setConfirmState] = useState({
    open: false, title: '', message: '', onConfirm: null, variant: 'danger', loading: false,
  })

  // Debounce helper
  const debounceRef = useRef(null)

  // Extract currently logged-in Admin user ID from JWT
  const currentAdminId = useMemo(() => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return (
        payload?.nameid ||
        payload?.sub ||
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        payload?.userId ||
        payload?.id ||
        null
      );
    } catch {
      return null;
    }
  }, [token]);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const formatLastVisit = (v) => {
    if (!v) return 'Never';
    if (typeof v === 'string' && v.startsWith('0001-01-01')) return 'Never';
    const d = new Date(v);
    if (isNaN(d)) return 'Never';
    return d.toLocaleString();
  };

  const formatDate = (v) => {
    if (!v) return '—';
    if (typeof v === 'string' && v.startsWith('0001-01-01')) return '—';
    const d = new Date(v);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/UserManagement/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = res?.data?.responseBody?.data
      if (Array.isArray(list) && list.length) setAvailableRoles(list)
    } catch { /* silent — fallback defaults already set */ }
  }

  const fetchUsers = useCallback(async (searchOverride, roleOverride, statusOverride, pageOverride) => {
    setLoading(true)
    const term   = searchOverride !== undefined ? searchOverride : searchTerm
    const role   = roleOverride   !== undefined ? roleOverride   : selectedRole
    const status = statusOverride !== undefined ? statusOverride : selectedStatus
    const pg     = pageOverride   !== undefined ? pageOverride   : page

    // Map status filter to backend query params
    let isActiveParam = undefined;
    let isDeletedParam = undefined;
    if (status === 'active') {
      isActiveParam = true;
      isDeletedParam = false;
    } else if (status === 'locked') {
      isActiveParam = false;
    } else if (status === 'deleted') {
      isDeletedParam = true;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/UserManagement/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pg,
          pageSize: PAGE_SIZE,
          name:  term || undefined,
          email: term || undefined,
          role:  role !== 'all' ? role : undefined,
          isActive: isActiveParam,
          isDeleted: isDeletedParam,
        },
      })

      if (response.data.statuscode === 200) {
        const body = response.data.responseBody
        setUsers(body?.data || [])
        // Use totalCount from server if available, otherwise fallback to array length
        setTotalCount(body?.totalCount ?? body?.total ?? (body?.data?.length || 0))
      } else {
        // Non-200 status inside body — show message, empty the list
        const msg = response.data.responseBody?.message || 'Failed to fetch users'
        toast.error(msg)
        setUsers([])
        setTotalCount(0)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // 404 = no users match the search — treat as empty, not an error
        setUsers([])
        setTotalCount(0)
      } else {
        toast.error('Failed to load users')
        setUsers([])
        setTotalCount(0)
      }
    } finally {
      setLoading(false)
    }
  }, [token, searchTerm, selectedRole, selectedStatus, page])

  // Debounced search: reset to page 1 on new search
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setPage(1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchUsers(value, undefined, undefined, 1)
    }, 400)
  }

  const handleRoleFilterChange = (value) => {
    setSelectedRole(value)
    setPage(1)
    fetchUsers(undefined, value, undefined, 1)
  }

  const handleStatusFilterChange = (value) => {
    setSelectedStatus(value)
    setPage(1)
    fetchUsers(undefined, undefined, value, 1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchUsers(undefined, undefined, undefined, newPage)
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchUsers()
      fetchRoles()
    }
    return () => clearTimeout(debounceRef.current)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD actions ──────────────────────────────────────────────────────────
  const handleDeleteUser = (id, displayName) => {
    setConfirmState({
      open: true,
      title: 'Delete User',
      message: `Delete "${displayName || 'this user'}"? This action cannot be undone.`,
      variant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }))
        try {
          setDeletingId(id)
          const res = await axios.delete(
            `${backendUrl}/api/UserManagement/delete-user/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
            setUsers(prev => prev.filter(u => u.id !== id))
            setTotalCount(c => Math.max(0, c - 1))
            toast.success('User deleted successfully')
          } else {
            toast.error(res.data?.responseBody?.message || 'Failed to delete user')
          }
        } catch (err) {
          if (err?.response?.status === 404) toast.error('User not found')
          else toast.error('Error deleting user')
        } finally {
          setDeletingId(null)
          setConfirmState(s => ({ ...s, open: false, loading: false }))
        }
      },
    })
  }

  const handleLockUser = (userId, displayName) => {
    setConfirmState({
      open: true,
      title: 'Lock User Account',
      message: `Lock "${displayName || 'this user'}"? They will be unable to sign in.`,
      variant: 'warning',
      loading: false,
      onConfirm: async () => {
        setConfirmState(s => ({ ...s, loading: true }))
        try {
          setLockingId(userId)
          const res = await axios.patch(
            `${backendUrl}/api/UserManagement/lock-user/${userId}`,
            null,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
            toast.success('User locked')
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false, isLock: true } : u))
            setSelectedUser(prev => prev?.id === userId ? { ...prev, isActive: false, isLock: true } : prev)
          } else {
            toast.error(res.data?.responseBody?.message || 'Failed to lock user')
          }
        } catch {
          toast.error('Error locking user')
        } finally {
          setLockingId(null)
          setConfirmState(s => ({ ...s, open: false, loading: false }))
        }
      },
    })
  }

  const handleUnlockUser = async (userId) => {
    try {
      setUnlockingId(userId)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/unlock-user/${userId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('User unlocked')
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true, isLock: false } : u))
        setSelectedUser(prev => prev?.id === userId ? { ...prev, isActive: true, isLock: false } : prev)
      } else {
        toast.error(res.data?.responseBody?.message || 'Failed to unlock user')
      }
    } catch {
      toast.error('Error unlocking user')
    } finally {
      setUnlockingId(null)
    }
  }

  const handleViewUser = async (id) => {
    if (!id) return
    setViewLoading(true)
    setViewOpen(true)
    setSelectedUser(null)
    setRoleInput('')
    try {
      const res = await axios.get(
        `${backendUrl}/api/UserManagement/user/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data) {
        setSelectedUser(res.data.responseBody.data)
      } else {
        toast.error(res.data?.responseBody?.message || 'Failed to load user')
        setViewOpen(false)
      }
    } catch (err) {
      if (err?.response?.status === 404) toast.error('User not found')
      else toast.error('Error loading user')
      setViewOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const handleAddRole = async (userId) => {
    const role = roleInput.trim()
    if (!userId) return toast.error('Invalid user id')
    if (!role) return toast.error('Please choose a role')
    if (currentAdminId && String(currentAdminId) === String(userId)) {
      return toast.error('You cannot modify your own roles')
    }
    const currentRoles = selectedUser?.roles || []
    if (currentRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
      return toast.info('User already has this role')
    }
    try {
      setRoleSubmitting(true)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/add-role/${userId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` }, params: { role } }
      )
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('Role added')
        setSelectedUser(prev => prev ? { ...prev, roles: [...(prev.roles || []), role] } : prev)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: [...(u.roles || []), role] } : u))
        setRoleInput('')
      } else {
        toast.error(res.data?.responseBody?.message || 'Failed to add role')
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error(err?.response?.data?.responseBody?.message || err?.response?.data?.message || 'The SuperAdmin role cannot be removed / Self-role modification blocked')
      } else if (err?.response?.status === 400) {
        toast.error(err?.response?.data?.responseBody?.message || err?.response?.data?.message || 'Bad request')
      } else {
        toast.error('Error adding role')
      }
    } finally {
      setRoleSubmitting(false)
    }
  }

  const handleRemoveRole = async (userId, role) => {
    const rLower = String(role).toLowerCase()
    if (rLower === 'superadmin' || rLower === 'super admin') {
      return toast.error('The SuperAdmin role cannot be removed')
    }
    if (currentAdminId && String(currentAdminId) === String(userId)) {
      return toast.error('You cannot modify your own roles')
    }

    const key = `${userId}:${role}`
    try {
      setRemovingRole(key)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/Remove-role/${userId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` }, params: { role } }
      )
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('Role removed')
        const filter = (roles) => (roles || []).filter(r => r.toLowerCase() !== role.toLowerCase())
        setSelectedUser(prev => prev ? { ...prev, roles: filter(prev.roles) } : prev)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: filter(u.roles) } : u))
      } else {
        toast.error(res.data?.responseBody?.message || 'Failed to remove role')
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error(err?.response?.data?.responseBody?.message || err?.response?.data?.message || 'The SuperAdmin role cannot be removed')
      } else if (err?.response?.status === 400) {
        toast.error(err?.response?.data?.responseBody?.message || err?.response?.data?.message || 'Bad request')
      } else {
        toast.error('Error removing role')
      }
    } finally {
      setRemovingRole(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Check if selected modal user is the currently logged-in SuperAdmin
  const isSelectedUserSelf = Boolean(
    currentAdminId && selectedUser && String(currentAdminId) === String(selectedUser.id)
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmVariant={confirmState.variant}
        confirmLabel={confirmState.variant === 'warning' ? 'Lock' : 'Delete'}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            {totalCount > 0 ? `${totalCount} user${totalCount !== 1 ? 's' : ''} total` : 'Manage accounts and permissions'}
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Role filter */}
        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-w-[140px]"
          value={selectedRole}
          onChange={(e) => handleRoleFilterChange(e.target.value)}
        >
          <option value="all">All Roles</option>
          {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {/* Status filter */}
        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-w-[140px]"
          value={selectedStatus}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="text-5xl opacity-30">👥</div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              {searchTerm ? 'No users match your search' : 'No users found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="mt-2 text-xs text-blue-500 hover:underline font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Name', 'Email', 'Phone', 'Status', 'Roles', 'Last Visit', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => {
                  const isLocked = Boolean(user.isLock || (!user.isActive && !user.isDeleted));
                  const isDeleted = Boolean(user.isDeleted);
                  const isActive = Boolean(user.isActive && !user.isDeleted && !user.isLock);
                  const isSelf = Boolean(currentAdminId && String(currentAdminId) === String(user.id));

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(user.name || user.userName || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{user.name || 'N/A'}</span>
                            {isSelf && (
                              <span className="text-[10px] text-blue-600 font-bold tracking-tight">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-4 text-sm text-gray-500">{user.email || 'N/A'}</td>
                      {/* Phone */}
                      <td className="px-5 py-4 text-sm text-gray-500">{user.phoneNumber || '—'}</td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {isDeleted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                              Deleted
                            </span>
                          ) : isLocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Locked
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : null}
                        </div>
                      </td>
                      {/* Roles */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.length
                            ? user.roles.map((role, i) => (
                                <RoleBadge
                                  key={i}
                                  role={role}
                                  isSuperAdminRole={String(role).toLowerCase() === 'superadmin' || String(role).toLowerCase() === 'super admin'}
                                />
                              ))
                            : <span className="text-xs text-gray-400">No roles</span>}
                        </div>
                      </td>
                      {/* Last Visit */}
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatLastVisit(user.lastVisit)}</td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => handleViewUser(user.id)}
                            aria-label={`View ${user.name || 'user'} details`}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all cursor-pointer"
                          >
                            View
                          </button>
                          {/* Lock / Unlock (blocked for self) */}
                          {!isSelf && !isDeleted && (
                            isLocked ? (
                              <button
                                onClick={() => handleUnlockUser(user.id)}
                                disabled={unlockingId === user.id}
                                aria-label={`Unlock ${user.name || 'user'}`}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {unlockingId === user.id ? '…' : 'Unlock'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLockUser(user.id, user.name || user.userName)}
                                disabled={lockingId === user.id}
                                aria-label={`Lock ${user.name || 'user'}`}
                                className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {lockingId === user.id ? '…' : 'Lock'}
                              </button>
                            )
                          )}
                          {/* Delete (not for self, not for users with admin role) */}
                          {!isSelf && !user.roles?.map(r => r.toLowerCase()).includes('admin') && !user.roles?.map(r => r.toLowerCase()).includes('superadmin') && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name || user.userName)}
                              disabled={deletingId === user.id}
                              aria-label={`Delete ${user.name || 'user'}`}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === user.id ? '…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400 font-medium">
            Page {page} of {totalPages} · {totalCount} total
          </p>
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              aria-label="Previous page"
              className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-25 transition-all"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 text-sm font-bold text-gray-900">{page}</span>
            <button
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              aria-label="Next page"
              className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-25 transition-all"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {viewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setViewOpen(false) }}
        >
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">User Details</h3>
              <button
                onClick={() => setViewOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {viewLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {!viewLoading && !selectedUser && (
                <p className="text-sm text-gray-400 text-center py-10">No user data.</p>
              )}

              {!viewLoading && selectedUser && (() => {
                const isModalLocked = Boolean(selectedUser.isLock || (!selectedUser.isActive && !selectedUser.isDeleted));
                const isModalDeleted = Boolean(selectedUser.isDeleted);
                const isModalActive = Boolean(selectedUser.isActive && !selectedUser.isDeleted && !selectedUser.isLock);

                return (
                  <div className="flex flex-col gap-6">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-black">
                        {(selectedUser.name || selectedUser.userName || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900 text-lg">{selectedUser.name || 'N/A'}</p>
                          {isSelectedUserSelf && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">You</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{selectedUser.userName || 'N/A'}</p>
                      </div>
                      {/* Status pill */}
                      <div className="ml-auto flex items-center">
                        {isModalDeleted ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            Deleted
                          </span>
                        ) : isModalLocked ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Locked
                          </span>
                        ) : isModalActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Self-role modification warning */}
                    {isSelectedUserSelf && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Self-role modification is blocked. You cannot modify your own roles.</span>
                      </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: 'Email',      value: selectedUser.email },
                        { label: 'Phone',      value: selectedUser.phoneNumber },
                        { label: 'Created At', value: formatDate(selectedUser.createAt) },
                        { label: 'Last Visit', value: formatLastVisit(selectedUser.lastVisit) },
                        { label: 'User ID',    value: selectedUser.id, mono: true, colSpan: 2 },
                      ].map(({ label, value, mono, colSpan }) => (
                        <div key={label} className={`bg-gray-50 rounded-2xl px-4 py-3 ${colSpan === 2 ? 'col-span-2' : ''}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                          <p className={`text-gray-800 font-semibold truncate ${mono ? 'font-mono text-xs' : ''}`}>{value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Customer Addresses */}
                    <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Saved Addresses ({selectedUser.customerAddresses?.length || 0})
                      </p>
                      {selectedUser.customerAddresses && selectedUser.customerAddresses.length > 0 ? (
                        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                          {selectedUser.customerAddresses.map((addr) => (
                            <div key={addr.id} className="p-3 bg-white border border-gray-200/80 rounded-xl text-xs flex flex-col gap-1 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                  <span>📍 {addr.addressType || 'Address'}</span>
                                  {addr.isDefault && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded border border-blue-200">
                                      Default
                                    </span>
                                  )}
                                </span>
                                {addr.phoneNumber && (
                                  <span className="text-gray-500 font-mono text-[11px]">{addr.phoneNumber}</span>
                                )}
                              </div>
                              <p className="text-gray-600 leading-relaxed">
                                {addr.fullAddress || [addr.streetAddress, addr.apartmentSuite, addr.city, addr.state, addr.country, addr.postalCode].filter(Boolean).join(', ')}
                              </p>
                              {addr.additionalNotes && (
                                <p className="text-gray-400 italic text-[11px]">Note: {addr.additionalNotes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No addresses saved</p>
                      )}
                    </div>

                    {/* Roles management */}
                    <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.roles?.length ? (
                          selectedUser.roles.map((r, i) => (
                            <RoleBadge
                              key={i}
                              role={r}
                              disabled={isSelectedUserSelf}
                              isSuperAdminRole={String(r).toLowerCase() === 'superadmin' || String(r).toLowerCase() === 'super admin'}
                              removing={removingRole === `${selectedUser.id}:${r}`}
                              onRemove={isSelectedUserSelf ? undefined : () => handleRemoveRole(selectedUser.id, r)}
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No roles assigned</span>
                        )}
                      </div>
                      {/* Add role (disabled for self) */}
                      {!isSelectedUserSelf && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <select
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                          >
                            <option value="">Select role…</option>
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button
                            onClick={() => handleAddRole(selectedUser?.id)}
                            disabled={roleSubmitting || !roleInput}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {roleSubmitting ? '…' : 'Add'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end px-8 py-4 border-t border-gray-100">
              <button
                onClick={() => setViewOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserList
