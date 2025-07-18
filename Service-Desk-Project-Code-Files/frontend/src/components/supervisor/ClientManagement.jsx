"use client"

import { useEffect, useState } from "react"

const ClientManagement = () => {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const token = localStorage.getItem("authToken")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/users?userType=Ordinary", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setUsers(data.data)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await fetch(`http://localhost:8000/api/admin/users/${userId}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      fetchUsers()
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await fetch(`http://localhost:8000/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUser),
      })
      setShowModal(false)
      fetchUsers()
      alert("User updated successfully!")
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    }
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Client Management</h2>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber}</td>
                <td>
                  <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEditUser(user)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm ${user.isActive ? "btn-danger" : "btn-success"}`}
                      onClick={() => toggleUserStatus(user._id)}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedUser && (
                <form onSubmit={handleUpdateUser} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedUser.fullName}
                      onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={selectedUser.phoneNumber}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update User
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientManagement
