// Imports
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

// App initialization
const app = express();
app.use(express.json());
app.use(cors());

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
app.post('/api/sync', async (req, res) => {
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
    res.status(500).json({
      error: 'Sync failed',
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    });
  }
});

app.post('/api/restore', async (req, res) => {
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
    res.status(500).json({
      error: 'Restore failed',
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    });
  }
});

// GET /api/data - aggregate all collections for frontend polling
app.get('/api/data', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch all data', details: err.message });
  }
});

// POST /mongo/:action/:collection - generic proxy for Data API
app.post('/mongo/:action/:collection', async (req, res) => {
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
    res.status(500).json({ error: 'MongoDB Data API request failed', details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
