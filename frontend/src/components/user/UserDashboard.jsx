import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import StoreCard from './StoreCard';
import PasswordChangeModal from '../models/PasswordChangeModal';

function UserDashboard({ user, onLogout }) {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const loadStores = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        name: filters.name,
        address: filters.address,
      });
      const data = await api.call(`/stores?${params}`);
      setStores(data);
    } catch (err) {
      alert(err.message);
    }
  }, [filters]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleRating = async (storeId, rating) => {
    try {
      await api.call('/ratings', {
        method: 'POST',
        body: JSON.stringify({ storeId, rating }),
      });
      loadStores();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Store Directory</h1>
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

      <div className="dashboard-content">
        <div className="filters">
          <input
            type="text"
            placeholder="Search by store name"
            value={filters.name}
            onChange={(e) =>
              setFilters({ ...filters, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Search by address"
            value={filters.address}
            onChange={(e) =>
              setFilters({ ...filters, address: e.target.value })
            }
          />
        </div>

        <div className="stores-grid">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onRate={handleRating}
            />
          ))}
        </div>
      </div>

      {showPasswordChange && (
        <PasswordChangeModal
          onClose={() => setShowPasswordChange(false)}
        />
      )}
    </div>
  );
}

export default UserDashboard;
