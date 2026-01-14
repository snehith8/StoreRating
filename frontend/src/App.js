import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import StoreOwnerDashboard from './components/storeowner/StoreOwnerDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  if (!user && showRegister) {
    return (
      <Register onBack={handleBackToLogin} onRegister={handleBackToLogin} />
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'user') {
    return <UserDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'store_owner') {
    return <StoreOwnerDashboard user={user} onLogout={handleLogout} />;
  }

  return null;
}

export default App;
