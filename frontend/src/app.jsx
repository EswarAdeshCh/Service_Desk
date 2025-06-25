import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import ClientPortal from "./components/client/ClientPortal"
import AuthenticationPage from "./components/auth/AuthenticationPage"
import RegistrationPage from "./components/auth/RegistrationPage"
import IssueSubmissionForm from "./components/client/IssueSubmissionForm"
import IssueTracker from "./components/client/IssueTracker"
import SupervisorHub from "./components/supervisor/SupervisorHub"
import TechnicianWorkspace from "./components/technician/TechnicianWorkspace"
import ClientManagement from "./components/supervisor/ClientManagement"
import WelcomePage from "./components/common/WelcomePage"
import TechnicianManagement from "./components/supervisor/TechnicianManagement"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("authenticatedUser"))

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!sessionStorage.getItem("authenticatedUser"));
    };

    window.addEventListener('storage', checkAuth);
    // This is a fallback for when storage event doesn't fire (e.g., same tab changes)
    // We can also pass a function down to AuthenticationPage to explicitly update this state.
    // For now, let's rely on the storage event and direct navigation.

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <div className="main-application">
      <Router>
        <Routes>
          <Route exact path="/" element={<WelcomePage />} />
          <Route path="/authenticate" element={<AuthenticationPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/create-account" element={<RegistrationPage />} />
          {isAuthenticated ? (
            <>
              <Route path="/technician-management" element={<TechnicianManagement />} />
              <Route path="/technician-workspace" element={<TechnicianWorkspace />} />
              <Route path="/client-management" element={<ClientManagement />} />
              <Route path="/supervisor-hub" element={<SupervisorHub />} />
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/submit-issue" element={<IssueSubmissionForm />} />
              <Route path="/track-issues" element={<IssueTracker />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/authenticate" replace />} />
          )}
        </Routes>
      </Router>
    </div>
  )
}

export default App
