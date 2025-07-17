"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const AuthenticationPage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
    console.log(`Input changed: ${name} - ${value}`);
    console.log('Current credentials:', credentials);
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed")
      }

      sessionStorage.setItem("authenticatedUser", JSON.stringify(data.data.user))
      sessionStorage.setItem("authToken", data.data.token)
      setIsAuthenticated(true) // Update authentication state

      const { userType } = data.data.user
      switch (userType) {
        case "Admin":
          navigate("/supervisor-hub")
          break
        case "Ordinary":
          navigate("/client-portal")
          break
        case "Agent":
          navigate("/technician-workspace")
          break
        default:
          navigate("/authenticate")
          break
      }
    } catch (error) {
      setError(error.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.closest('form')
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
        form.dispatchEvent(submitEvent)
      }
    }
  }

  return (
    <div className="auth-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <a href="/" className="navbar-brand">
              Service Desk for Customer Complaint Resolution
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link">
                Home
              </a>
              <a href="/create-account" className="nav-link">
                Create Account
              </a>
              <a href="/authenticate" className="nav-link active">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="auth-content">
        <div className="auth-card">
          <div className="card-header">
            <h2 className="card-title">Welcome Back</h2>
            <p className="card-subtitle">Please sign in to access your account</p>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={credentials.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  value={credentials.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <a href="/create-account" className="auth-link">
                  Create one here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthenticationPage
