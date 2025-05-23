require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: '*', // In production, replace with your actual frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const chatgptRoutes = require('./routes/chatgpt');

// Use routes
app.use('/api/chatgpt', chatgptRoutes);

// Models
const Profile = require('./models/Profile');
const Analysis = require('./models/Analysis');

// Routes
app.post('/api/profiles', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.params.userId });
    res.json(profiles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/analyses', async (req, res) => {
  try {
    const analysis = new Analysis(req.body);
    await analysis.save();
    res.status(201).json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analyses/:profileId', async (req, res) => {
  try {
    const analyses = await Analysis.find({ profileId: req.params.profileId })
      .sort({ date: -1 });
    res.json(analyses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export data endpoint
app.get('/api/export/:userId', async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.params.userId });
    const analyses = await Analysis.find({ 
      profileId: { $in: profiles.map(p => p._id) }
    });
    
    const data = {
      profiles,
      analyses
    };
    
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Import data endpoint
app.post('/api/import/:userId', async (req, res) => {
  try {
    const { profiles, analyses } = req.body;
    
    // Import profiles
    const importedProfiles = await Promise.all(
      profiles.map(profile => {
        const newProfile = new Profile({
          ...profile,
          userId: req.params.userId
        });
        return newProfile.save();
      })
    );
    
    // Import analyses
    const importedAnalyses = await Promise.all(
      analyses.map(analysis => {
        const newAnalysis = new Analysis({
          ...analysis,
          profileId: analysis.profileId
        });
        return newAnalysis.save();
      })
    );
    
    res.json({
      profiles: importedProfiles,
      analyses: importedAnalyses
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
}); 