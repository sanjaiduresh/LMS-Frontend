import React, { useState } from "react";
import axios from "axios";
// import "../styles/CreateEmployee.css";
export default function CreateEmployee({ onUserCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    casual: 0,
    sick: 0,
    earned: 0,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        leaveBalance: {
          casual: formData.casual,
          sick: formData.sick,
          earned: formData.earned,
          updatedAt: new Date(),
        },
      });
      alert("User created successfully!");
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        casual: 0,
        sick: 0,
        earned: 0,
      });
      onUserCreated(); // refresh user list
    } catch (err) {
      console.error(err);
      alert("Failed to create user.");
    }
  };

  return (
    <form className="create-user-form card" onSubmit={handleSubmit}>
      <h3>Create New Employee</h3>

      <label htmlFor="name">Name:</label>
      <input
        id="name"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="email">Email:</label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <label htmlFor="password">Password:</label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <label htmlFor="role">Role:</label>
      <select
        id="role"
        name="role"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
      </select>

      <div className="leave-inputs">
        <label htmlFor="casual">Casual Leaves:</label>
        <input
          id="casual"
          name="casual"
          type="number"
          placeholder="Casual Leaves"
          value={formData.casual}
          onChange={handleChange}
        />

        <label htmlFor="sick">Sick Leaves:</label>
        <input
          id="sick"
          name="sick"
          type="number"
          placeholder="Sick Leaves"
          value={formData.sick}
          onChange={handleChange}
        />

        <label htmlFor="earned">Earned Leaves:</label>
        <input
          id="earned"
          name="earned"
          type="number"
          placeholder="Earned Leaves"
          value={formData.earned}
          onChange={handleChange}
        />
      </div>

      <button type="submit">Create User</button>
    </form>
  );
}
