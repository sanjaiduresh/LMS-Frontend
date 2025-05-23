import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token || (roleRequired && userRole !== roleRequired)) {
    return <Navigate to="/login" />;
  }

  return children;
}
