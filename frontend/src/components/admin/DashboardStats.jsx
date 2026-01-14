import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.call('/admin/dashboard');
      setStats(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) return <div>Loading statistics...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Users</h3>
        <div className="stat-value">{stats.totalUsers}</div>
      </div>
      <div className="stat-card">
        <h3>Total Stores</h3>
        <div className="stat-value">{stats.totalStores}</div>
      </div>
      <div className="stat-card">
        <h3>Total Ratings</h3>
        <div className="stat-value">{stats.totalRatings}</div>
      </div>
    </div>
  );
}

export default DashboardStats;
