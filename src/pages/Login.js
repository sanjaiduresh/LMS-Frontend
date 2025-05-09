import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

export default function Login({ setToken }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/login", form);
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
      } else {
        navigate(`/dashboard/${user._id}`);
      }    
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };
  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>    
      <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <button type="submit">Login</button>
      <p>{message}</p>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </form>
  );
}
