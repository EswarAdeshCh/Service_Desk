"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import IssueSubmissionForm from "./IssueSubmissionForm"
import IssueTracker from "./IssueTracker"

const ClientPortal = () => {
  const navigate = useNavigate()
  const [clientName, setClientName] = useState("")
  const [activeTab, setActiveTab] = useState("submit")

  useEffect(() => {
    const user = sessionStorage.getItem("authenticatedUser")
    if (user) {
      const userData = JSON.parse(user)
      setClientName(userData.name || userData.fullName)
    } else {
      navigate("/authenticate")
    }
  }, [navigate])

  const handleLogout = () => {
    sessionStorage.removeItem("authenticatedUser")
    sessionStorage.removeItem("authToken")
    navigate("/")
  }

  return (
    <div className="portal-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <h1 className="portal-title">Welcome, {clientName}</h1>
            <button onClick={handleLogout} className="btn btn-outline">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="portal-content">
        <div className="container">
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={`tab-button ${activeTab === "submit" ? "active" : ""}`}
                onClick={() => setActiveTab("submit")}
              >
                Submit New Issue
              </button>
              <button
                className={`tab-button ${activeTab === "track" ? "active" : ""}`}
                onClick={() => setActiveTab("track")}
              >
                Track My Issues
              </button>
            </div>
            <div className="tabs-content">
              {activeTab === "submit" && <IssueSubmissionForm />}
              {activeTab === "track" && <IssueTracker />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
