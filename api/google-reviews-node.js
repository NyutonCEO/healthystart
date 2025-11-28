/**
 * Google Reviews API Endpoint - Node.js/Express Implementation
 * 
 * Install dependencies:
 * npm install express cors dotenv node-fetch
 * 
 * Usage:
 * 1. Create .env file with GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID
 * 2. Run: node google-reviews-node.js
 * 3. Access: http://localhost:3000/api/google-reviews
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the healthystart directory
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

// Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.get('/api/google-reviews', async (req, res) => {
  const placeId = process.env.GOOGLE_PLACE_ID || req.query.place_id;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!placeId || !apiKey) {
    return res.status(400).json({ 
      error: 'Missing API credentials',
      message: 'Please configure GOOGLE_PLACE_ID and GOOGLE_PLACES_API_KEY'
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      // Format response for frontend
      res.json({
        success: true,
        name: data.result.name,
        rating: data.result.rating,
        totalRatings: data.result.user_ratings_total,
        reviews: (data.result.reviews || []).map(review => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          relative_time_description: review.relative_time_description,
          time: review.time
        }))
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to fetch reviews', 
        status: data.status,
        message: data.error_message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Google Reviews API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Website: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/google-reviews`);
  console.log(`\n✨ All features are ready!`);
  console.log(`   - Trust badges in hero & footer`);
  console.log(`   - Enhanced How It Works section`);
  console.log(`   - Safety & Compliance section`);
  console.log(`   - Google Reviews (with fallbacks)`);
});

module.exports = app;

