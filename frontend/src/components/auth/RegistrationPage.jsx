"use client"

import { useState } from "react"

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    userType: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      setSuccess("Account created successfully!")
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        userType: "",
      })
    } catch (error) {
      setError(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <a href="/" className="navbar-brand">
              ServiceDesk Pro
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link">
                Home
              </a>
              <a href="/create-account" className="nav-link active">
                Create Account
              </a>
              <a href="/authenticate" className="nav-link">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card auth-card-wide">
          <div className="card-header">
            <h2 className="card-title">Create Your Account</h2>
            <p className="card-subtitle">Join our platform and start managing your service requests</p>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}

            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    className="form-control"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="form-control"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="userType" className="form-label">
                  Account Type
                </label>
                <select
                  id="userType"
                  name="userType"
                  className="form-control"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose Account Type</option>
                  <option value="Ordinary">Ordinary</option>
                  <option value="Agent">Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <a href="/authenticate" className="auth-link">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationPage
