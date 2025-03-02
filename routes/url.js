const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const urlsFile = path.join(__dirname, '../data/urls.json');

let recentUrls = []; // Array to store recent URLs

// Home route
router.get('/', (req, res) => {
  fs.readFile(urlsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading URL data');

    const urls = JSON.parse(data);
    const recentUrls = urls.slice(-4); // Keep last 4 URLs for 2x2 grid

    res.render('index', { shortUrl: null, recentUrls });
  });
});

// Shorten URL POST route
router.post('/shorten', (req, res) => {
  const { originalUrl } = req.body;

  const shortCode = crypto.randomBytes(4).toString('hex');
  const shortUrl = `http://localhost:3000/${shortCode}`;

  const newUrl = { shortCode, originalUrl, shortUrl };

  fs.readFile(urlsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading URL data');

    const urls = JSON.parse(data);
    urls.push(newUrl);

    fs.writeFile(urlsFile, JSON.stringify(urls, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving URL data');

      // Add to recent URLs (keep only last 5)
      recentUrls.unshift(newUrl);
      if (recentUrls.length > 5) recentUrls.pop();

      res.render('index', { shortUrl, recentUrls });
    });
  });
});

// Redirect shortened URL route
router.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  fs.readFile(urlsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading URL data');

    const urls = JSON.parse(data);
    const foundUrl = urls.find(url => url.shortCode === shortCode);

    if (!foundUrl) return res.status(404).send('URL not found');

    res.redirect(foundUrl.originalUrl);
  });
});

module.exports = router;
