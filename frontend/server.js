const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Initialize SQLite Database
const dbPath = process.env.DB_PATH || path.join(__dirname, 'store_ratings.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Create Tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) >= 15 AND length(name) <= 60),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT CHECK(length(address) <= 400),
    role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'store_owner')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Stores table (store owners are also users)
  db.run(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    store_address TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Ratings table
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  )`);

  // Create default admin user
  const defaultAdmin = {
    name: 'System Administrator Account',
    email: 'admin@platform.com',
    password: bcrypt.hashSync('Admin@123', 10),
    address: '123 Admin Street, Platform City',
    role: 'admin',
  };

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [defaultAdmin.email],
    (err, row) => {
      if (!row) {
        db.run(
          'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
          [
            defaultAdmin.name,
            defaultAdmin.email,
            defaultAdmin.password,
            defaultAdmin.address,
            defaultAdmin.role,
          ],
        );
      }
    },
  );
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// AUTH ROUTES

// Register (Normal Users Only)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, address } = req.body;

  // Validation
  if (!name || name.length < 15 || name.length > 60) {
    return res
      .status(400)
      .json({ error: 'Name must be between 15 and 60 characters' });
  }

  if (!address || address.length > 400) {
    return res
      .status(400)
      .json({ error: 'Address must not exceed 400 characters' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        'Password must be 8-16 characters with at least one uppercase letter and one special character',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, 'user'],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
          message: 'User registered successfully',
          userId: this.lastID,
        });
      },
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
    });
  });
});

// Update Password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
  if (!newPassword || !passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        'Password must be 8-16 characters with at least one uppercase letter and one special character',
    });
  }

  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!validPassword)
        return res.status(401).json({ error: 'Current password is incorrect' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Password updated successfully' });
        },
      );
    },
  );
});

// ADMIN ROUTES

// Get Dashboard Statistics
app.get('/api/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalUsers = result.count;

    db.get('SELECT COUNT(*) as count FROM stores', (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalStores = result.count;

      db.get('SELECT COUNT(*) as count FROM ratings', (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalRatings = result.count;
        res.json(stats);
      });
    });
  });
});

// Add User (Admin, User, or Store Owner)
app.post(
  '/api/admin/users',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { name, email, password, address, role, storeName, storeAddress } =
      req.body;

    // Validation
    if (!name || name.length < 15 || name.length > 60) {
      return res
        .status(400)
        .json({ error: 'Name must be between 15 and 60 characters' });
    }

    if (!address || address.length > 400) {
      return res
        .status(400)
        .json({ error: 'Address must not exceed 400 characters' });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          'Password must be 8-16 characters with at least one uppercase letter and one special character',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'store_owner' && (!storeName || !storeAddress)) {
      return res
        .status(400)
        .json({ error: 'Store name and address required for store owners' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, address, role],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }

          const userId = this.lastID;

          if (role === 'store_owner') {
            db.run(
              'INSERT INTO stores (user_id, store_name, store_address) VALUES (?, ?, ?)',
              [userId, storeName, storeAddress],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({
                  message: 'Store owner created successfully',
                  userId,
                });
              },
            );
          } else {
            res
              .status(201)
              .json({ message: 'User created successfully', userId });
          }
        },
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Get All Users with Filtering and Sorting
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const {
    name,
    email,
    address,
    role,
    sortBy = 'name',
    sortOrder = 'ASC',
  } = req.query;

  let query = `
    SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
           s.store_name, s.store_address,
           COALESCE(AVG(r.rating), 0) as avg_rating
    FROM users u
    LEFT JOIN stores s ON u.id = s.user_id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE 1=1
  `;
  const params = [];

  if (name) {
    query += ' AND u.name LIKE ?';
    params.push(`%${name}%`);
  }
  if (email) {
    query += ' AND u.email LIKE ?';
    params.push(`%${email}%`);
  }
  if (address) {
    query += ' AND u.address LIKE ?';
    params.push(`%${address}%`);
  }
  if (role) {
    query += ' AND u.role = ?';
    params.push(role);
  }

  query += ` GROUP BY u.id ORDER BY u.${sortBy} ${sortOrder}`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get All Stores with Filtering and Sorting
app.get('/api/admin/stores', authenticateToken, requireAdmin, (req, res) => {
  const {
    name,
    email,
    address,
    sortBy = 'store_name',
    sortOrder = 'ASC',
  } = req.query;

  let query = `
    SELECT s.id, s.store_name, s.store_address, u.email,
           COALESCE(AVG(r.rating), 0) as avg_rating,
           COUNT(r.id) as rating_count
    FROM stores s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE 1=1
  `;
  const params = [];

  if (name) {
    query += ' AND s.store_name LIKE ?';
    params.push(`%${name}%`);
  }
  if (email) {
    query += ' AND u.email LIKE ?';
    params.push(`%${email}%`);
  }
  if (address) {
    query += ' AND s.store_address LIKE ?';
    params.push(`%${address}%`);
  }

  query += ` GROUP BY s.id ORDER BY ${
    sortBy === 'name' ? 's.store_name' : sortBy
  } ${sortOrder}`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// USER ROUTES

// Get All Stores (for normal users)
app.get('/api/stores', authenticateToken, (req, res) => {
  const { name, address, sortBy = 'store_name', sortOrder = 'ASC' } = req.query;

  let query = `
    SELECT s.id, s.store_name, s.store_address,
           COALESCE(AVG(r.rating), 0) as avg_rating,
           COUNT(r.id) as rating_count,
           ur.rating as user_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = ?
    WHERE 1=1
  `;
  const params = [req.user.id];

  if (name) {
    query += ' AND s.store_name LIKE ?';
    params.push(`%${name}%`);
  }
  if (address) {
    query += ' AND s.store_address LIKE ?';
    params.push(`%${address}%`);
  }

  query += ` GROUP BY s.id ORDER BY ${sortBy} ${sortOrder}`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Submit or Update Rating
app.post('/api/ratings', authenticateToken, (req, res) => {
  const { storeId, rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (req.user.role !== 'user') {
    return res
      .status(403)
      .json({ error: 'Only normal users can submit ratings' });
  }

  db.run(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)
     ON CONFLICT(user_id, store_id) DO UPDATE SET rating = ?, updated_at = CURRENT_TIMESTAMP`,
    [req.user.id, storeId, rating, rating],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Rating submitted successfully' });
    },
  );
});

// STORE OWNER ROUTES

// Get Store Owner Dashboard
app.get('/api/store-owner/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'store_owner') {
    return res.status(403).json({ error: 'Store owner access required' });
  }

  db.get(
    'SELECT id FROM stores WHERE user_id = ?',
    [req.user.id],
    (err, store) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!store) return res.status(404).json({ error: 'Store not found' });

      db.get(
        'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as rating_count FROM ratings WHERE store_id = ?',
        [store.id],
        (err, stats) => {
          if (err) return res.status(500).json({ error: err.message });

          db.all(
            `SELECT u.name, u.email, r.rating, r.created_at, r.updated_at
             FROM ratings r
             JOIN users u ON r.user_id = u.id
             WHERE r.store_id = ?
             ORDER BY r.updated_at DESC`,
            [store.id],
            (err, ratings) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ ...stats, ratings });
            },
          );
        },
      );
    },
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
