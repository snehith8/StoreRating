import { useState } from 'react';
import DashboardStats from './DashboardStats';
import UsersList from './UsersList';
import StoresList from './StoresList';
import AddUserModal from '../models/AddUserModal';
import PasswordChangeModal from '../models/PasswordChangeModal';

function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user.name}</span>
          <button
            onClick={() => setShowPasswordChange(true)}
            className="btn-secondary"
          >
            Change Password
          </button>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={view === 'users' ? 'active' : ''}
          onClick={() => setView('users')}
        >
          Users
        </button>
        <button
          className={view === 'stores' ? 'active' : ''}
          onClick={() => setView('stores')}
        >
          Stores
        </button>
      </nav>

      <main className="dashboard-content">
        {view === 'dashboard' && <DashboardStats />}

        {view === 'users' && (
          <UsersList onAddUser={() => setShowAddUser(true)} />
        )}

        {view === 'stores' && <StoresList />}
      </main>

      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}

      {showPasswordChange && (
        <PasswordChangeModal onClose={() => setShowPasswordChange(false)} />
      )}
    </div>
  );
}

export default AdminDashboard;
