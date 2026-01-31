import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'

const UserList = ({ token }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleInput, setRoleInput] = useState('')
  const [roleSubmitting, setRoleSubmitting] = useState(false)
  const [removingRole, setRemovingRole] = useState(null) // e.g. "userId:role"
  const [lockingId, setLockingId] = useState(null)
  const [unlockingId, setUnlockingId] = useState(null)
  const [availableRoles, setAvailableRoles] = useState(["admin", "user", "delivery"]) // fallback defaults

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${backendUrl}/api/UserManagement/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          pageSize: 10,
          name: searchTerm || undefined,
          email: searchTerm || undefined,
          role: selectedRole !== 'all' ? selectedRole : undefined,
          // phonenumber, IsActive, isDeleted can be added similarly when you add UI controls
        }
      })

      // Replace this block inside fetchUsers after the axios.get call
      if (response.data.statuscode === 200) {
        setUsers(response.data.responseBody?.data || [])
        console.log('Sample user:', response.data.responseBody?.data);
      } else {
        toast.error(response.data.responseBody?.message || 'Failed to fetch users')
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error fetching users. The API endpoint might not be implemented yet.')
      // For demonstration, create mock data
      const mockUsers = [
        { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer', createdAt: new Date().toISOString() },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'customer', createdAt: new Date().toISOString() },
        { _id: '3', name: 'Admin User', email: process.env.ADMIN_EMAIL || 'admin@example.com', role: 'admin', createdAt: new Date().toISOString() }
      ]
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  // Fetch available roles from API to avoid 400 due to wrong casing/naming
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/UserManagement/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = res?.data?.responseBody?.data
      if (Array.isArray(list) && list.length) {
        setAvailableRoles(list)
      }
    } catch (err) {
      console.warn('Failed to fetch roles, using defaults', err?.response?.data || err)
    }
  }

  const handleDeleteUser = async (id, displayName) => {
    if (!id) {
      toast.error('Invalid user id')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${displayName || 'this user'}?`)
    if (!confirmed) return

    try {
      setDeletingId(id)
      const res = await axios.delete(
        `${backendUrl}/api/UserManagement/delete-user/${id}`,
        { headers: { Authorization: `Bearer ${token}` } } // keeping same header style you use in fetchUsers
      )

      // API success shape: statuscode === 0 and responseBody.data === true
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        // Remove from list
        setUsers(prev => prev.filter(u => u.id !== id))
        toast.success('User deleted successfully')
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to delete user'
        toast.error(msg)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else {
        toast.error('Error deleting user')
      }
      console.error('Delete user error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewUser = async (id) => {
    if (!id) return
    setViewLoading(true)
    setViewOpen(true)
    setSelectedUser(null)

    try {
      const res = await axios.get(
        `${backendUrl}/api/UserManagement/user/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Success: statuscode === 200 and user in responseBody.data
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data) {
        setSelectedUser(res.data.responseBody.data)
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to load user'
        toast.error(msg)
        setViewOpen(false)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else {
        toast.error('Error loading user')
      }
      setViewOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const handleAddRole = async (userId) => {
    const role = roleInput.trim()
    if (!userId) return toast.error('Invalid user id')
    if (!role) return toast.error('Please choose a role')

    // Prevent duplicate role assignment
    const currentRoles = selectedUser?.roles || []
    if (currentRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
      return toast.info('User already has this role')
    }

    try {
      setRoleSubmitting(true)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/add-role/${userId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { role }, // API expects role in query
        }
      )

      // Success: statuscode === 200 and responseBody.data === true
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('Role added successfully')

        // Update selectedUser in modal
        setSelectedUser(prev =>
          prev ? { ...prev, roles: [...(prev.roles || []), role] } : prev
        )

        // Update the list row as well
        setUsers(prev =>
          prev.map(u => (u.id === userId
            ? { ...u, roles: [...(u.roles || []), role] }
            : u
          ))
        )

        setRoleInput('')
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to add role'
        toast.error(msg)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else if (err?.response?.status === 400) {
        toast.error(err?.response?.data?.responseBody?.message || 'Bad request')
      } else {
        toast.error('Error adding role')
      }
      console.error('Add role error:', err)
    } finally {
      setRoleSubmitting(false)
    }
  }

  const handleRemoveRole = async (userId, role) => {
    if (!userId) return toast.error('Invalid user id')
    if (!role) return toast.error('Invalid role')

    const key = `${userId}:${role}`
    try {
      setRemovingRole(key)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/Remove-role/${userId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { role }, // role in query
        }
      )

      // Success: statuscode === 200 and responseBody.data === true
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('Role removed successfully')

        // Update modal user
        setSelectedUser(prev =>
          prev ? { ...prev, roles: (prev.roles || []).filter(r => r.toLowerCase() !== role.toLowerCase()) } : prev
        )

        // Update table list row
        setUsers(prev =>
          prev.map(u => (u.id === userId
            ? { ...u, roles: (u.roles || []).filter(r => r.toLowerCase() !== role.toLowerCase()) }
            : u
          ))
        )
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to remove role'
        toast.error(msg)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else if (err?.response?.status === 400) {
        toast.error(err?.response?.data?.responseBody?.message || 'Bad request')
      } else {
        toast.error('Error removing role')
      }
      console.error('Remove role error:', err)
    } finally {
      setRemovingRole(null)
    }
  }

  const handleLockUser = async (userId, displayName) => {
    if (!userId) return toast.error('Invalid user id')
    const confirmed = window.confirm(`Lock ${displayName || 'this user'}? They will be unable to sign in.`)
    if (!confirmed) return

    try {
      setLockingId(userId)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/lock-user/${userId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // success: statuscode === 200 and responseBody.data === true
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('User locked')

        // Update table list
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, isActive: false } : u)))
        // Update modal if open
        setSelectedUser(prev => (prev?.id === userId ? { ...prev, isActive: false } : prev))
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to lock user'
        toast.error(msg)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else {
        toast.error('Error locking user')
      }
      console.error('Lock user error:', err)
    } finally {
      setLockingId(null)
    }
  }

  const handleUnlockUser = async (userId, displayName) => {
    if (!userId) return toast.error('Invalid user id')

    try {
      setUnlockingId(userId)
      const res = await axios.patch(
        `${backendUrl}/api/UserManagement/unlock-user/${userId}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // success: statuscode === 200 and responseBody.data === true
      if (res.data?.statuscode === 200 && res.data?.responseBody?.data === true) {
        toast.success('User unlocked')

        // Update table list
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, isActive: true } : u)))
        // Update modal if open
        setSelectedUser(prev => (prev?.id === userId ? { ...prev, isActive: true } : prev))
      } else {
        const msg = res.data?.responseBody?.message || 'Failed to unlock user'
        toast.error(msg)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('User not found (404)')
      } else {
        toast.error('Error unlocking user')
      }
      console.error('Unlock user error:', err)
    } finally {
      setUnlockingId(null)
    }
  }


  useEffect(() => {
    if (token) {
      fetchUsers()
      fetchRoles()
    }
  }, [token])

  // Place near component top (inside file, outside JSX)
  const formatLastVisit = (v) => {
    if (!v) return 'Never';
    // Handle .NET min date or placeholder strings
    if (typeof v === 'string' && v.startsWith('0001-01-01')) return 'Never';

    const d = new Date(v);
    if (isNaN(d)) return 'Never';
    return d.toLocaleString(); // or toLocaleDateString() if you prefer only date
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.userName?.toLowerCase().includes(q)

    const matchesRole = selectedRole === 'all' || user.roles?.includes(selectedRole)

    return matchesSearch && matchesRole
  })


  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">User Management</h2>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={fetchUsers}
        >
          Refresh
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] md:min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.phoneNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {user.isDeleted && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role, index) => {
                              const rl = String(role).toLowerCase();
                              const badgeClass = rl === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : rl === 'delivery'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800';
                              return (
                                <span
                                  key={index}
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}
                                >
                                  {role}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-xs text-gray-400">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastVisit(user.lastVisit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Existing View button here */}

                        {/* Lock/Unlock */}
                        {user.isActive ? (
                          <button
                            className="text-yellow-600 hover:text-yellow-800 mr-3 disabled:opacity-50"
                            disabled={lockingId === user.id}
                            onClick={() => handleLockUser(user.id, user.name || user.userName)}
                          >
                            {lockingId === user.id ? 'Locking...' : 'Lock'}
                          </button>
                        ) : (
                          <button
                            className="text-green-600 hover:text-green-800 mr-3 disabled:opacity-50"
                            disabled={unlockingId === user.id}
                            onClick={() => handleUnlockUser(user.id, user.name || user.userName)}
                          >
                            {unlockingId === user.id ? 'Unlocking...' : 'Unlock'}
                          </button>
                        )}
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => handleViewUser(user.id)}
                        >
                          View
                        </button>
                        {!user.roles?.includes('admin') && (
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={deletingId === user.id}
                            onClick={() => handleDeleteUser(user.id, user.name || user.userName)}
                          >
                            {deletingId === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      )}
      {/* View User Modal */}
      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setViewOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {viewLoading && <p className="text-sm text-gray-500">Loading...</p>}

              {!viewLoading && selectedUser && (
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">ID:</span> {selectedUser.id}</div>
                  <div><span className="font-medium">Name:</span> {selectedUser.name || 'N/A'}</div>
                  <div><span className="font-medium">Username:</span> {selectedUser.userName || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {selectedUser.email || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {selectedUser.phoneNumber || 'N/A'}</div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                    {selectedUser.isDeleted ? ' • Deleted' : ''}
                  </div>
                  <div><span className="font-medium">Last Visit:</span> {formatLastVisit(selectedUser.lastVisit)}</div>
                  <div className="flex flex-col gap-3">
                    {/* Roles List */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium mr-1">Roles:</span>
                      {selectedUser.roles?.length ? (
                        selectedUser.roles.map((r, i) => {
                          const key = `${selectedUser.id}:${r}`;
                          const isRemoving = removingRole === key;
                          const isAdmin = r.toLowerCase() === "admin"; // admin role محمي
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${isAdmin
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {r}
                              {!isAdmin && (
                                <button
                                  type="button"
                                  className="ml-1 text-xs px-1 rounded hover:bg-black/10 disabled:opacity-50"
                                  disabled={isRemoving}
                                  onClick={() => handleRemoveRole(selectedUser.id, r)}
                                  title={`Remove ${r}`}
                                >
                                  {isRemoving ? "..." : "×"}
                                </button>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400">No roles</span>
                      )}
                    </div>

                    {/* Add Role UI */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded-md px-2 py-1 text-sm"
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                        >
                          <option value="">Select role</option>
                          {availableRoles.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>

                        <button
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
                          disabled={roleSubmitting || !roleInput}
                          onClick={() => handleAddRole(selectedUser?.id)}
                        >
                          {roleSubmitting ? "Adding..." : "Add Role"}
                        </button>
                      </div>

                      {selectedUser?.roles?.length ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Existing: {selectedUser.roles.join(", ")}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No roles yet</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {!viewLoading && !selectedUser && (
                <p className="text-sm text-gray-500">No user data.</p>
              )}
            </div>

            <div className="flex justify-end border-t px-4 py-3">
              <button
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                onClick={() => setViewOpen(false)}
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