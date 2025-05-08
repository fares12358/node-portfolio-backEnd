const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const visitorRoutes = require('./routes/visitorRoutes');
const Visitor = require('./models/Visitor');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // To parse JSON
app.use(visitorRoutes); // Use our tracking route

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error(err));

app.get('/', (req, res) => {
  res.status(200).json({ message: "hello portfolio back end" })
})

app.get('/visitor-count', async (req, res) => {
  try {
    const visitorDoc = await Visitor.findOne();
    const totalVisits = visitorDoc ? visitorDoc.visits.length : 0;

    res.status(200).json({ total: totalVisits });
  } catch (err) {
    console.error('Error getting visitor count:', err);
    res.status(500).json({ error: 'Failed to retrieve visitor count' });
  }
});

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
