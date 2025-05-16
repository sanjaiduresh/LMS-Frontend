import React, { useState } from "react";
import axios from "axios";
import API_URL from "../api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Register({ setToken }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
  const res = await axios.post(`${API_URL}/register`, {
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
  });

  if (res.status === 201) {
    alert("Registration successful!");
    navigate(`/dashboard/${res.data.id}`); // Use `res.data.id` instead of `res.data.user._id`
  }
} catch (error) {
  console.error("Error response:", error.response || error);
  alert(error.response?.data?.error || "Registration failed. Please try again.");
}

  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <select
        name="role"
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        required
      >
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
        <option value="admin">Admin</option>
      </select>

      <button type="submit">Register</button>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </form>
  );
}
