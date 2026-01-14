import { useState } from 'react';
import api from '../../utils/api';

function Register({ onBack, onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.call('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSuccess('Registration successful! Please login.');
      setTimeout(() => onRegister(), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name (15-60 characters)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              minLength={15}
              maxLength={60}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Password (8-16 chars, 1 uppercase, 1 special)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              pattern='^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,16}$'
              required
            />
          </div>
          <div className="form-group">
            <label>Address (Max 400 characters)</label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              maxLength={400}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="button-group">
            <button type="button" onClick={onBack} className="btn-secondary">
              Back to Login
            </button>
            <button type="submit" className="btn-primary">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
