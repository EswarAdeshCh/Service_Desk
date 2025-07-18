"use client"

import { useEffect, useState } from "react"

const TechnicianManagement = () => {
  const [agents, setAgents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [newAgent, setNewAgent] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
  })
  const token = localStorage.getItem("authToken")

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/agents", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setAgents(data.data)
    } catch (error) {
      console.error("Error fetching agents:", error)
    }
  }

  const toggleAgentStatus = async (agentId) => {
    try {
      await fetch(`http://localhost:8000/api/admin/users/${agentId}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      fetchAgents()
    } catch (error) {
      console.error("Error toggling agent status:", error)
    }
  }

  const handleEditAgent = (agent) => {
    setSelectedAgent(agent)
    setShowModal(true)
  }

  const handleUpdateAgent = async (e) => {
    e.preventDefault()
    try {
      await fetch(`http://localhost:8000/api/admin/agents/${selectedAgent._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedAgent),
      })
      setShowModal(false)
      fetchAgents()
      alert("Agent updated successfully!")
    } catch (error) {
      console.error("Error updating agent:", error)
      alert("Failed to update agent")
    }
  }

  const handleCreateAgent = async (e) => {
    e.preventDefault()
    try {
      await fetch("http://localhost:8000/api/admin/agents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAgent),
      })
      setShowCreateModal(false)
      setNewAgent({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
      })
      fetchAgents()
      alert("Agent created successfully!")
    } catch (error) {
      console.error("Error creating agent:", error)
      alert("Failed to create agent")
    }
  }

  const deleteAgent = async (agentId) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await fetch(`http://localhost:8000/api/admin/agents/${agentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        fetchAgents()
        alert("Agent deleted successfully!")
      } catch (error) {
        console.error("Error deleting agent:", error)
        alert("Failed to delete agent")
      }
    }
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Technician Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          Add New Agent
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Active Complaints</th>
              <th>Total Assigned</th>
              <th>Resolved</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent._id}>
                <td>{agent.fullName}</td>
                <td>{agent.email}</td>
                <td>{agent.phoneNumber}</td>
                <td>{agent.workload?.active || 0}</td>
                <td>{agent.workload?.total || 0}</td>
                <td>{agent.workload?.resolved || 0}</td>
                <td>
                  <span className={`badge ${agent.isActive ? "badge-success" : "badge-danger"}`}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEditAgent(agent)}>
                      Edit
                    </button>
                    <button
                      className={`btn btn-sm ${agent.isActive ? "btn-danger" : "btn-success"}`}
                      onClick={() => toggleAgentStatus(agent._id)}
                    >
                      {agent.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteAgent(agent._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Agent Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Agent</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedAgent && (
                <form onSubmit={handleUpdateAgent} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedAgent.fullName}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={selectedAgent.email}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={selectedAgent.phoneNumber}
                      onChange={(e) => setSelectedAgent({ ...selectedAgent, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Agent
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Agent</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateAgent} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAgent.fullName}
                    onChange={(e) => setNewAgent({ ...newAgent, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newAgent.password}
                    onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={newAgent.phoneNumber}
                    onChange={(e) => setNewAgent({ ...newAgent, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicianManagement
