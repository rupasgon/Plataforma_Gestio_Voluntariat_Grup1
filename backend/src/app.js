const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const voluntarisRoutes = require('./routes/voluntaris.routes');
const aprenentsRoutes = require('./routes/aprenents.routes');
const pairingsRoutes = require('./routes/pairings.routes');
const profileRoutes = require('./routes/profile.routes');

const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middlewares principals
app.use(cors());
app.use(express.json());

// Comprovacio de salut de l'API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
});

// Rutes de l'aplicacio
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/voluntaris', voluntarisRoutes);
app.use('/api/aprenents', aprenentsRoutes);
app.use('/api/pairings', pairingsRoutes);
app.use('/api/profile', profileRoutes);

// Gestor d'errors centralitzat
app.use(errorMiddleware);

module.exports = app;

