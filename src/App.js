import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard'; // 👈 create this component if needed

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
        <Route path="/admin-dashboard/:id" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
