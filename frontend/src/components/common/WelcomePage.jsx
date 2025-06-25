const WelcomePage = () => {
  return (
    <div className="welcome-container">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <a href="/" className="navbar-brand">
              ServiceDesk Pro
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link active">
                Home
              </a>
              <a href="/create-account" className="nav-link">
                Create Account
              </a>
              <a href="/authenticate" className="nav-link">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Transform Your Service Management</h1>
              <p className="hero-description">
                Experience next-generation issue tracking and resolution with our comprehensive service desk platform
                designed for modern businesses and their customers.
              </p>
              <div className="hero-actions">
                <a href="/submit-issue" className="btn btn-primary btn-lg">
                  Report an Issue
                </a>
              </div>
            </div>

            <div className="hero-features">
              <div className="feature-card">
                <h3>24/7 Support</h3>
                <p>Round-the-clock assistance</p>
              </div>
              <div className="feature-card">
                <h3>Real-time Tracking</h3>
                <p>Monitor progress instantly</p>
              </div>
              <div className="feature-card">
                <h3>Expert Resolution</h3>
                <p>Professional technicians</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
