"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const SupervisorHub = () => {
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState("Dashboard")
  const [adminName, setAdminName] = useState("")
  const [dashboardStats, setDashboardStats] = useState({})
  const [complaints, setComplaints] = useState([])
  const [users, setUsers] = useState([])
  const [agents, setAgents] = useState([])
  const token = sessionStorage.getItem("authToken")

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("authenticatedUser"))
        if (user) {
          setAdminName(user.name || user.fullName)
        } else {
          navigate("/")
        }
      } catch (error) {
        console.log(error)
      }
    }

    fetchAdminData()
    fetchDashboardStats()
  }, [navigate])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setDashboardStats(data.data || {})
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchComplaints = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      setComplaints(data.data)
    } catch (error) {
      console.error("Error fetching complaints:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/users", {
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

  const handleSectionChange = (sectionName) => {
    setCurrentSection(sectionName)

    switch (sectionName) {
      case "Complaints":
        fetchComplaints()
        break
      case "Users":
        fetchUsers()
        break
      case "Agents":
        fetchAgents()
        break
      default:
        break
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("authenticatedUser")
    sessionStorage.removeItem("authToken")
    navigate("/")
  }

  const assignComplaint = async (complaintId, agentId) => {
    try {
      await fetch(`http://localhost:8000/api/admin/complaints/${complaintId}/assign`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      })
      alert("Complaint assigned successfully!")
      fetchComplaints()
    } catch (error) {
      console.error("Error assigning complaint:", error)
      alert("Failed to assign complaint")
    }
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

  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number text-primary">{dashboardStats?.complaints?.total || 0}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-warning">{dashboardStats?.complaints?.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-success">{dashboardStats?.complaints?.resolved || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-info">{dashboardStats?.users?.total || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
      </div>
    </div>
  )

  const renderComplaints = () => (
    <div className="complaints-container">
      <div className="complaints-header">
        <h2>Complaint Management</h2>
      </div>
      <div className="table-container">
        <table className="table table-white-text">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned Agent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint._id}>
                <td>{complaint.complaintId}</td>
                <td>
                  <span className={`badge ${getStatusClass(complaint.status)}`}>{complaint.status}</span>
                </td>
                <td className="text-white">{complaint.priority}</td>
                <td className="text-white">{complaint.assignedAgent?.fullName || "Unassigned"}</td>
                <td>
                  {complaint.status === "Pending" && (
                    <select
                      className="form-control form-control-sm"
                      onChange={(e) => assignComplaint(complaint._id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="">Assign Agent</option>
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="users-container">
      <div className="users-header">
        <h2>User Management</h2>
      </div>
      <div className="table-container">
        <table className="table table-white-text">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.userType}</td>
                <td>
                  <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAgents = () => (
    <div className="agents-container">
      <div className="agents-header">
        <h2>Agent Management</h2>
      </div>
      <div className="table-container">
        <table className="table table-white-text">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Active Complaints</th>
              <th>Total Assigned</th>
              <th>Resolved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent._id}>
                <td>{agent.fullName}</td>
                <td>{agent.email}</td>
                <td>{agent.workload?.active || 0}</td>
                <td>{agent.workload?.total || 0}</td>
                <td>{agent.workload?.resolved || 0}</td>
                <td>
                  <span className={`badge ${agent.isActive ? "badge-success" : "badge-danger"}`}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="supervisor-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <h1 className="portal-title">Admin Dashboard - {adminName}</h1>
            <div className="nav-section">
              <div className="nav-buttons">
                <button
                  className={`nav-button ${currentSection === "Dashboard" ? "active" : ""}`}
                  onClick={() => handleSectionChange("Dashboard")}
                >
                  Dashboard
                </button>
                <button
                  className={`nav-button ${currentSection === "Complaints" ? "active" : ""}`}
                  onClick={() => handleSectionChange("Complaints")}
                >
                  Complaints
                </button>
                <button
                  className={`nav-button ${currentSection === "Users" ? "active" : ""}`}
                  onClick={() => handleSectionChange("Users")}
                >
                  Users
                </button>
                <button
                  className={`nav-button ${currentSection === "Agents" ? "active" : ""}`}
                  onClick={() => handleSectionChange("Agents")}
                >
                  Agents
                </button>
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="supervisor-content">
        <div className="container">
          {currentSection === "Dashboard" && renderDashboard()}
          {currentSection === "Complaints" && renderComplaints()}
          {currentSection === "Users" && renderUsers()}
          {currentSection === "Agents" && renderAgents()}
        </div>
      </div>
    </div>
  )
}

export default SupervisorHub
