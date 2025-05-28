import { useState } from 'react';
import axios from 'axios';
import API_URL from '../api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

export default function Login({ setToken }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await axios.post(`${API_URL}/login`, form);
      const { token, user } = res.data;
      
      if (!user || !user._id) {
        setMessage("Invalid user data received.");
        return;
      }
      
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      setToken({ token, role: user.role });
      
      if (user.role === 'admin') {
        navigate(`/admin-dashboard/${user._id}`);
      } else if(user.role === 'employee') {
        navigate(`/EmployeeDashboard/${user._id}`);
      } else if(user.role === 'hr') {
        navigate(`/HRDashboard/${user._id}`);
      } else if(user.role === 'manager') {
        navigate(`/ManagerDashboard/${user._id}`);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-gradient-orb auth-orb-1"></div>
        <div className="auth-gradient-orb auth-orb-2"></div>
        <div className="auth-gradient-orb auth-orb-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Welcome!</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input 
              type="email" 
              className="auth-input"
              placeholder="Enter your email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <input 
              type="password" 
              className="auth-input"
              placeholder="Enter your password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required 
            />
          </div>

          {message && (
            <div className="auth-message auth-message-error">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button auth-button-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="auth-loading-spinner"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account? 
            <Link to="/register" className="auth-link">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}