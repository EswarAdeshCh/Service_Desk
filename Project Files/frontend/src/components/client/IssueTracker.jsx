"use client"

import { useEffect, useState } from "react"
import CommunicationWindow from "../common/CommunicationWindow"

const IssueTracker = () => {
  const [issues, setIssues] = useState([])
  const [openCommunications, setOpenCommunications] = useState({})

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://localhost:8000/api/complaints/my-complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIssues(data.data)
      }
    } catch (error) {
      console.error("Error fetching issues:", error)
    }
  }

  const toggleCommunication = (issueId) => {
    setOpenCommunications((prev) => ({
      ...prev,
      [issueId]: !prev[issueId],
    }))
  }

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "status-pending"
      case "resolved":
        return "status-resolved"
      case "in-progress":
        return "status-progress"
      case "assigned":
        return "status-assigned"
      default:
        return "status-default"
    }
  }

  if (issues.length === 0) {
    return (
      <div className="alert alert-info">
        You haven't submitted any service requests yet. Use the "Submit New Issue" tab to get started.
      </div>
    )
  }

  return (
    <div className="issues-container">
      <div className="issues-header">
        <h2>Your Issue Status Dashboard</h2>
        <p>Monitor the progress of all your submitted service requests</p>
      </div>

      <div className="issues-list">
        {issues.map((issue) => (
          <div key={issue._id} className="issue-card">
            <div className="issue-header">
              <h3 className="issue-title">Issue #{issue.complaintId || issue._id.slice(-6)}</h3>
              <span className={`badge ${getStatusClass(issue.status)}`}>{issue.status}</span>
            </div>
            <div className="issue-content">
              <div className="issue-details">
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <p>
                    <strong>Name:</strong> {issue.name}
                  </p>
                  <p>
                    <strong>Location:</strong> {issue.city}, {issue.state}
                  </p>
                  <p>
                    <strong>Postal Code:</strong> {issue.pincode}
                  </p>
                </div>

                <div className="detail-section detail-section-wide">
                  <h4>Issue Details</h4>
                  <p className="issue-description">{issue.comment}</p>
                  <p>
                    <strong>Service Address:</strong> {issue.address}
                  </p>
                </div>
              </div>

              <div className="communication-section">
                <button className="btn btn-outline btn-full" onClick={() => toggleCommunication(issue._id)}>
                  {openCommunications[issue._id] ? "Close Communication" : "Open Communication"}
                </button>

                {openCommunications[issue._id] && (
                  <div className="communication-container">
                    <CommunicationWindow complaintId={issue._id} name={issue.name} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IssueTracker
