/* src/pages/Login.tsx (or wherever you keep it) */
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import '../styles/Auth.css';
import API_URL from '../api';
import { User, Role } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface LoginProps {
  setToken: (token: { token: string; role: Role }) => void;
}

interface LoginForm {
  email: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function Login({ setToken }: LoginProps) {
  const [form, setForm]         = useState<LoginForm>({ email: '', password: '' });
  const [message, setMessage]   = useState<string>('');
  const [loading, setLoading]   = useState<boolean>(false);
  const navigate                = useNavigate();

  /* ------------- submit ------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res   = await axios.post<{ token: string; user: User }>(`${API_URL}/login`, form);
      const { token, user } = res.data;

      if (!user?._id) {
        setMessage('Invalid user data received.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      setToken({ token, role: user.role });

      switch (user.role) {
        case 'admin':    navigate(`/admin-dashboard/${user._id}`);    break;
        case 'employee': navigate(`/EmployeeDashboard/${user._id}`);  break;
        case 'hr':       navigate(`/HRDashboard/${user._id}`);        break;
        case 'manager':  navigate(`/ManagerDashboard/${user._id}`);   break;
        default:         setMessage('Unknown user role.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="auth-container">
      {/* ---------- fancy background blobs --------------------------- */}
      <div className="auth-background">
        <div className="auth-gradient-orb auth-orb-1" />
        <div className="auth-gradient-orb auth-orb-2" />
        <div className="auth-gradient-orb auth-orb-3" />
      </div>

      {/* ---------- glass card -------------------------------------- */}
      <div className="auth-card">
        {/* --- header icon / title --- */}
        <header className="auth-header">
          <div className="auth-icon">
            {/* user icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
              <path d="M12 14c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z"/>
            </svg>
          </div>
          <h1 className="auth-title">Welcome!</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </header>

        {/* --- form --- */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* email */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* password */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {/* feedback */}
          {message && (
            <div className="auth-message auth-message-error" role="alert">
              {message}
            </div>
          )}

          {/* submit */}
          <button type="submit"
                  className="auth-button"
                  disabled={loading}
                  aria-label="Sign in">
            {loading ? <div className="auth-loading-spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* --- footer links --- */}
        <footer className="auth-footer">
          <p className="auth-footer-text">
            Don’t have an account?
            <Link to="/register" className="auth-link">Create one here</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
