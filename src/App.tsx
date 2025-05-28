import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import Register from './pages/Register';
import Login from './pages/Login';
import EmployeeDashboard from './EmployeeDashboard';
import AdminDashboard from './AdminDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import { Role } from './types';

interface Token {
  token: string;
  role: Role;
}

export default function App() {
  const [token, setToken] = useState<Token | null>(
    localStorage.getItem('token')
      ? { token: localStorage.getItem('token')!, role: localStorage.getItem('userRole') as Role }
      : null
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/EmployeeDashboard/:id" element={<EmployeeDashboard />} />
        <Route path="/HRDashboard/:id" element={<HRDashboard />} />
        <Route path="/ManagerDashboard/:id" element={<ManagerDashboard />} />
        <Route path="/admin-dashboard/:id" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}