import React, { useState } from "react";
import axios from "axios";
import API_URL from "../api";
import "../styles/CreateEmployee.css";

export default function CreateEmployee({ managers, onCreated, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "", // Add manager assignment
    casual: 10, // Set default values
    sick: 5,
    earned: 15,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        leaveBalance: {
          casual: parseInt(formData.casual),
          sick: parseInt(formData.sick),
          earned: parseInt(formData.earned),
          updatedAt: new Date(),
        },
      };

      // Only add managerId if role is employee and managerId is selected
      if (formData.role === "employee" && formData.managerId) {
        payload.managerId = formData.managerId;
      }

      await axios.post(`${API_URL}/register`, payload);
      
      alert("Employee created successfully!");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        managerId: "",
        casual: 10,
        sick: 5,
        earned: 15,
      });
      
      if (onCreated) onCreated(); // Refresh data
      if (onClose) onClose(); // Close modal
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Failed to create employee.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-user-form" onSubmit={handleSubmit}>
      <h3>Create New Employee</h3>

      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          name="name"
          placeholder="Enter full name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
        />
      </div>

      <div className="form-group">
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
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Show manager selection only for employees */}
      {formData.role === "employee" && (
        <div className="form-group">
          <label htmlFor="managerId">Assign Manager:</label>
          <select
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            required
          >
            <option value="">Select a manager</option>
            {managers && managers.map((manager) => (
              <option key={manager._id} value={manager._id}>
                {manager.name} ({manager.email})
              </option>
            ))}
          </select>
          {((!managers) || managers.length) === 0 && (
            <small className="warning">No managers available. Create a manager first.</small>
          )}
        </div>
      )}

      <div className="leave-balances">
        <h4>Initial Leave Balances</h4>
        
        <div className="leave-inputs-grid">
          <div className="form-group">
            <label htmlFor="casual">Casual Leaves:</label>
            <input
              id="casual"
              name="casual"
              type="number"
              min="0"
              max="50"
              value={formData.casual}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sick">Sick Leaves:</label>
            <input
              id="sick"
              name="sick"
              type="number"
              min="0"
              max="50"
              value={formData.sick}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="earned">Earned Leaves:</label>
            <input
              id="earned"
              name="earned"
              type="number"
              min="0"
              max="50"
              value={formData.earned}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Employee"}
        </button>
      </div>
    </form>
  );
}