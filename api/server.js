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
const express = require('express');
const fetch = require('node-fetch');

const API_KEY = process.env.MONGODB_DATA_API_KEY;
const BASE_URL = 'https://data.mongodb-api.com/app/data-backend/endpoint/data/v1';

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
