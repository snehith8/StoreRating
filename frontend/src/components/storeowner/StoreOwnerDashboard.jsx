import { useState, useEffect } from 'react';
import api from '../../utils/api';
import PasswordChangeModal from '../models/PasswordChangeModal';

function StoreOwnerDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.call('/store-owner/dashboard');
      setDashboardData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!dashboardData) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Store Owner Dashboard</h1>
        <div className="header-actions">
          <span>Welcome, {user.name}</span>
          <button onClick={() => setShowPasswordChange(true)} className="btn-secondary">
            Change Password
          </button>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Average Rating</h3>
            <div className="stat-value">{dashboardData.avg_rating.toFixed(1)} ★</div>
          </div>
          <div className="stat-card">
            <h3>Total Ratings</h3>
            <div className="stat-value">{dashboardData.rating_count}</div>
          </div>
        </div>

        <h2>User Ratings</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Rating</th>
              <th>Date Submitted</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.ratings.map((rating, idx) => (
              <tr key={idx}>
                <td>{rating.name}</td>
                <td>{rating.email}</td>
                <td>{rating.rating} ★</td>
                <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                <td>{new Date(rating.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPasswordChange && (
        <PasswordChangeModal onClose={() => setShowPasswordChange(false)} />
      )}
    </div>
  );
}

export default StoreOwnerDashboard;