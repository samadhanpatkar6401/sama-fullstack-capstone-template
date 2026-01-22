require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');

const connectToDatabase = require('./models/db');

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Connect to MongoDB
connectToDatabase()
  .then(() => logger.info('Connected to DB'))
  .catch((e) => {
    logger.error(e, 'Failed to connect to DB');
  });


// Routes (DO NOT CALL THEM)
const giftRoutes = require('./routes/giftRoutes');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');

// ✅ CORRECT
app.use('/api/gifts', giftRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
