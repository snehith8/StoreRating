import {useState, useEffect, useCallback} from 'react'
import api from '../../utils/api'

function UsersList({onAddUser}) {
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '',
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ASC',
  })

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      })

      const data = await api.call(`/admin/users?${params}`)
      setUsers(data)
    } catch (err) {
      alert(err.message)
    }
  }, [filters, sortConfig])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC',
    }))
  }

  return (
    <>
      <div className="actions-bar">
        <button onClick={onAddUser} className="btn-primary" type="button">
          Add New User
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Filter by name"
          value={filters.name}
          onChange={e =>
            setFilters(prev => ({...prev, name: e.target.value}))
          }
        />
        <input
          type="text"
          placeholder="Filter by email"
          value={filters.email}
          onChange={e =>
            setFilters(prev => ({...prev, email: e.target.value}))
          }
        />
        <input
          type="text"
          placeholder="Filter by address"
          value={filters.address}
          onChange={e =>
            setFilters(prev => ({...prev, address: e.target.value}))
          }
        />
        <select
          value={filters.role}
          onChange={e =>
            setFilters(prev => ({...prev, role: e.target.value}))
          }
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="store_owner">Store Owner</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')}>
              Name{' '}
              {sortConfig.key === 'name' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email{' '}
              {sortConfig.key === 'email' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('address')}>
              Address{' '}
              {sortConfig.key === 'address' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('role')}>
              Role{' '}
              {sortConfig.key === 'role' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.address}</td>
              <td>{user.role}</td>
              <td>
                {user.role === 'store_owner'
                  ? user.avg_rating.toFixed(1)
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default UsersList
