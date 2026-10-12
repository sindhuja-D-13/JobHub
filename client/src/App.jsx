
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Authentication pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import Jobs from "./pages/student/Jobs";
import JobDetails from "./pages/student/JobDetails";
import ApplyJob from "./pages/student/ApplyJob";
import MyApplications from "./pages/student/MyApplications";
import StudentProfile from "./pages/student/StudentProfile";

// Company pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyJobs from "./pages/company/MyJobs";
import PostJob from "./pages/company/PostJob";
import CompanyApplications from "./pages/company/Applications";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplications from "./pages/admin/Applications";
import JobApprovals from "./pages/admin/JobApprovals";
import ShortlistApprovals from "./pages/admin/ShortlistApprovals";
import Students from "./pages/admin/Students";
import Companies from "./pages/admin/Companies";

// Protected routes
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  if (
    !user ||
    !user.role ||
    !allowedRoles.includes(String(user.role).toLowerCase())
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/jobs"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Jobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/apply/:jobId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ApplyJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/apply"
          element={<Navigate to="/student/jobs" replace />}
        />

        <Route
          path="/student/applications"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={<Navigate to="/student/profile" replace />}
        />

        {/* Company */}
        <Route
          path="/company/dashboard"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/company/post-job"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <PostJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/company/jobs"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/company/applications"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyApplications />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/job-approvals"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <JobApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Companies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/shortlist-approvals"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ShortlistApprovals />
            </ProtectedRoute>
          }
        />

        {/* Unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
