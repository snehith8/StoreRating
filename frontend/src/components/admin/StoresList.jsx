import {useState, useEffect, useCallback} from 'react'
import api from '../../utils/api'

function StoresList() {
  const [stores, setStores] = useState([])
  const [filters, setFilters] = useState({name: '', email: '', address: ''})
  const [sortConfig, setSortConfig] = useState({
    key: 'store_name',
    direction: 'ASC',
  })

  const loadStores = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        name: filters.name,
        email: filters.email,
        address: filters.address,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      })

      const data = await api.call(`/admin/stores?${params}`)
      setStores(data)
    } catch (err) {
      alert(err.message)
    }
  }, [filters, sortConfig])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC',
    }))
  }

  return (
    <>
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
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('store_name')}>
              Name{' '}
              {sortConfig.key === 'store_name' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')}>
              Email{' '}
              {sortConfig.key === 'email' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('store_address')}>
              Address{' '}
              {sortConfig.key === 'store_address' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('avg_rating')}>
              Rating{' '}
              {sortConfig.key === 'avg_rating' &&
                (sortConfig.direction === 'ASC' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {stores.map(store => (
            <tr key={store.id}>
              <td>{store.store_name}</td>
              <td>{store.email}</td>
              <td>{store.store_address}</td>
              <td>
                {store.avg_rating.toFixed(1)} ({store.rating_count} ratings)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default StoresList