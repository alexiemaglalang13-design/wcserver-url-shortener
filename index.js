require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

  const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true,
    unique: true
  }
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function(req, res) {
  const originalUrl = req.body.url;

  const urlPattern = /^https?:\/\/.+/;

  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const url = new Url({
    original_url: originalUrl,
    short_url: Date.now()
  });

  try {
    const savedUrl = await url.save();

    res.json({
      original_url: savedUrl.original_url,
      short_url: savedUrl.short_url
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = Number(req.params.short_url);

  try {
    const url = await Url.findOne({ short_url: shortUrl });

    if (!url) {
      return res.json({ error: 'No short URL found' });
    }

    res.redirect(url.original_url);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
