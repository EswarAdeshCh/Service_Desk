"use client"

import { useState } from "react"

const IssueSubmissionForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    comment: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const clearForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      comment: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const user = JSON.parse(localStorage.getItem("authenticatedUser") || "{}")
      const token = localStorage.getItem("authToken")

      const complaintData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        comment: formData.comment,
      }

      const response = await fetch("http://localhost:8000/api/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaintData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit issue")
      }

      setMessage("Your issue has been submitted successfully!")
      clearForm()
    } catch (error) {
      setMessage("Failed to submit issue. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Report a New Issue</h3>
        <p className="card-subtitle">Please provide detailed information about your service request</p>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${message.includes("successfully") ? "alert-success" : "alert-danger"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="issue-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Service Address
              </label>
              <input
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row form-row-three">
            <div className="form-group">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                id="city"
                name="city"
                className="form-control"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">
                State
              </label>
              <input
                id="state"
                name="state"
                className="form-control"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pincode" className="form-label">
                Zip Code
              </label>
              <input
                id="pincode"
                name="pincode"
                className="form-control"
                value={formData.pincode}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment" className="form-label">
              Issue Description
            </label>
            <textarea
              id="comment"
              name="comment"
              className="form-control form-textarea"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Please describe your issue in detail..."
              rows={6}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Issue Report"}
            </button>
            <button type="button" className="btn btn-outline" onClick={clearForm}>
              Clear All Fields
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueSubmissionForm
