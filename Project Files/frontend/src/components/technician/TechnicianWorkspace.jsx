"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import CommunicationWindow from "../common/CommunicationWindow"

const TechnicianWorkspace = () => {
  const navigate = useNavigate()
  const [agentName, setAgentName] = useState("")
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({
    assigned: 0,
    resolved: 0,
    total: 0,
    pendingMessages: 0,
  })
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [resolutionText, setResolutionText] = useState("")
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [showCommunicationModal, setShowCommunicationModal] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    const user = sessionStorage.getItem("authenticatedUser")
    if (user) {
      const userData = JSON.parse(user)
      setAgentName(userData.name || userData.fullName)
    } else {
      navigate("/authenticate")
    }

    fetchDashboardStats()
    fetchComplaints()
  }, [navigate])

  const fetchDashboardStats = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/agents/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchComplaints = async () => {
    try {
      const token = sessionStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/agents/assigned-complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setComplaints(data.data)
      }
    } catch (error) {
      console.error("Error fetching complaints:", error)
    }
  }

  const updateStatus = async (complaintId, status) => {
    try {
      const token = sessionStorage.getItem("authToken")
      const response = await fetch(`http://localhost:8000/api/agents/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchComplaints()
        fetchDashboardStats()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const resolveComplaint = async (e) => {
    e.preventDefault()
    if (!resolutionText.trim()) return

    try {
      const token = sessionStorage.getItem("authToken")
      const response = await fetch(`http://localhost:8000/api/agents/complaints/${selectedComplaint._id}/resolve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolutionDescription: resolutionText }),
      })

      if (response.ok) {
        setResolutionText("")
        setShowResolutionModal(false)
        fetchComplaints()
        fetchDashboardStats()
      }
    } catch (error) {
      console.error("Error resolving complaint:", error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("authenticatedUser")
    sessionStorage.removeItem("authToken")
    navigate("/")
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "badge-warning"
      case "Assigned":
        return "badge-info"
      case "In-Progress":
        return "badge-primary"
      case "Resolved":
        return "badge-success"
      case "Closed":
        return "badge-secondary"
      default:
        return "badge-secondary"
    }
  }

  const openResolutionModal = (complaint) => {
    setSelectedComplaint(complaint)
    setShowResolutionModal(true)
  }

  const openCommunicationModal = (complaint) => {
    setSelectedComplaint(complaint)
    setShowCommunicationModal(true)
  }

  return (
    <div className="technician-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <h1 className="portal-title">Agent Workspace - {agentName}</h1>
            <button onClick={handleLogout} className="btn btn-outline">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="technician-content">
        <div className="container">
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`tab-button ${activeTab === "complaints" ? "active" : ""}`}
                onClick={() => setActiveTab("complaints")}
              >
                My Complaints
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === "dashboard" && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number text-info">{stats.assigned}</div>
                    <div className="stat-label">Assigned</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number text-success">{stats.resolved}</div>
                    <div className="stat-label">Resolved</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number text-primary">{stats.total}</div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number text-warning">{stats.pendingMessages}</div>
                    <div className="stat-label">Pending Messages</div>
                  </div>
                </div>
              )}

              {activeTab === "complaints" && (
                <div className="complaints-container">
                  <div className="complaints-header">
                    <h2>My Assigned Complaints</h2>
                  </div>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Customer</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.map((complaint) => (
                          <tr key={complaint._id}>
                            <td>{complaint.complaintId}</td>
                            <td>{complaint.name}</td>
                            <td>{complaint.comment?.substring(0, 50)}...</td>
                            <td>
                              <span className={`badge ${getStatusClass(complaint.status)}`}>{complaint.status}</span>
                            </td>
                            <td>{complaint.priority}</td>
                            <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                {complaint.status === "Assigned" && (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => updateStatus(complaint._id, "In-Progress")}
                                  >
                                    Start Work
                                  </button>
                                )}
                                {complaint.status === "In-Progress" && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => openResolutionModal(complaint)}
                                  >
                                    Resolve
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openCommunicationModal(complaint)}
                                >
                                  Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="modal-overlay" onClick={() => setShowResolutionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Resolve Complaint</h3>
              <button className="modal-close" onClick={() => setShowResolutionModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={resolveComplaint} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Resolution Description</label>
                  <textarea
                    className="form-control form-textarea"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    rows={4}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowResolutionModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!resolutionText.trim()}>
                    Mark as Resolved
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Communication Modal */}
      {showCommunicationModal && (
        <div className="modal-overlay" onClick={() => setShowCommunicationModal(false)}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Communication - {selectedComplaint?.complaintId}</h3>
              <button className="modal-close" onClick={() => setShowCommunicationModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <CommunicationWindow complaintId={selectedComplaint?._id} name={agentName} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicianWorkspace
