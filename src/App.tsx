import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import CompanyDashboard from './pages/CompanyDashboard';

function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          currentUser ? (
            currentUser.role === 'company' ? (
              <CompanyDashboard />
            ) : currentUser.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <div>
                <h1>Dashboard</h1>
                <p>Role: {currentUser.role}</p>
              </div>
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
