const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const API_KEY = process.env.MONGODB_DATA_API_KEY;
const BASE_URL = 'https://data.mongodb-api.com/app/data-backend/endpoint/data/v1';

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
