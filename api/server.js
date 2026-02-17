
// Imports
const express = require('express');
const fetch = require('node-fetch');
// const cors = require('cors');

// App initialization (MUST be before any routes)
const app = express();
app.use(express.json());

// Manual CORS middleware for full preflight support
app.use((req, res, next) => {
  console.log('CORS middleware running for', req.method, req.url);
  res.header('Access-Control-Allow-Origin', 'https://frontend-f-lckm.onrender.com');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Production-grade error logging
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

console.log('Server starting...');
console.log('Frontend allowed origin:', process.env.FRONTEND_URL);
console.log('Mongo API Key present:', !!process.env.MONGODB_DATA_API_KEY);

// Config
const API_KEY = process.env.MONGODB_DATA_API_KEY;
const BASE_URL = 'https://data.mongodb-api.com/app/data-backend/endpoint/data/v1';

// Helper to strip Mongo meta fields
const stripMongoMeta = (arr = []) => arr.map(({ _id, __v, ...rest }) => rest);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simulated sync/restore endpoints (replace with real DB logic if needed)
app.post('/api/sync', async (req, res, next) => {
  try {
    const { workers = [], shifts = [], leaves = [], advances = [], posts = [], announcements = [] } = req.body;
    console.log("SYNC counts", { workers: workers.length, shifts: shifts.length, leaves: leaves.length, advances: advances.length, posts: posts.length, announcements: announcements.length });
    // Strip meta fields
    const cleanWorkers = stripMongoMeta(workers);
    const cleanShifts = stripMongoMeta(shifts);
    const cleanLeaves = stripMongoMeta(leaves);
    const cleanAdvances = stripMongoMeta(advances);
    const cleanPosts = stripMongoMeta(posts);
    const cleanAnnouncements = stripMongoMeta(announcements);
    // Simulate insertMany with ordered:false
    // Replace with real DB logic as needed
    res.json({ status: 'ok', inserted: true });
  } catch (err) {
    console.error('Route Error:', err);
    next(err);
  }
});

app.post('/api/restore', async (req, res, next) => {
  try {
    const { workers = [], shifts = [], leaves = [], advances = [], posts = [], announcements = [] } = req.body;
    console.log("RESTORE counts", { workers: workers.length, shifts: shifts.length, leaves: leaves.length, advances: advances.length, posts: posts.length, announcements: announcements.length });
    // Strip meta fields
    const cleanWorkers = stripMongoMeta(workers);
    const cleanShifts = stripMongoMeta(shifts);
    const cleanLeaves = stripMongoMeta(leaves);
    const cleanAdvances = stripMongoMeta(advances);
    const cleanPosts = stripMongoMeta(posts);
    const cleanAnnouncements = stripMongoMeta(announcements);
    // Simulate insertMany with ordered:false
    // Replace with real DB logic as needed
    res.json({ status: 'ok', inserted: true });
  } catch (err) {
    console.error('Route Error:', err);
    next(err);
  }
});

// GET /api/data - aggregate all collections for frontend polling
app.get('/api/data', async (req, res, next) => {
  try {
    const collections = [
      'shifts',
      'leaves',
      'posts',
      'workers',
      'advanceRequests',
      'announcements',
    ];
    const results = await Promise.all(collections.map(async (col) => {
      const response = await fetch(`${BASE_URL}/action/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY,
        },
        body: JSON.stringify({
          dataSource: 'fastep',
          database: 'fastep',
          collection: col,
          filter: {},
        }),
      });
      const data = await response.json();
      return data.documents || [];
    }));
    res.json({
      shifts: results[0],
      leaves: results[1],
      posts: results[2],
      workers: results[3],
      advanceRequests: results[4],
      announcements: results[5],
    });
  } catch (err) {
    console.error('Route Error:', err);
    next(err);
  }
});

// POST /mongo/:action/:collection - generic proxy for Data API
app.post('/mongo/:action/:collection', async (req, res, next) => {
  const { action, collection } = req.params;
  const body = req.body;
  try {
    const response = await fetch(`${BASE_URL}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        dataSource: 'fastep',
        database: 'fastep',
        collection,
        ...body,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Route Error:', err);
    next(err);
  }
});

// Global error handler (must be before app.listen)
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: err.stack
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
