const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const visitorRoutes = require('./routes/visitorRoutes');
const Visitor = require('./models/Visitor');
const transporter = require('./utils/nodemailer');
const dotenv = require('dotenv');
dotenv.config();

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


async function createAdminPassword() {
  const newPassword = 'fm01124711424';
  const hash = await bcrypt.hash(newPassword, 10);
  const email = 'fm883254@gmail.com';
  const visitor = await Visitor.findOne();
  if (!visitor) {
    console.log('No visitor document found. Creating one...');
    const newVisitor = new Visitor({
      visits: [],
      admin: { password: hash },
    });
    await newVisitor.save();
    console.log('New admin created with hashed password and email sent.');
  } else {
    visitor.admin.password = hash;
    await visitor.save();
    console.log('Admin password updated and email sent.');
  }
  await transporter.sendMail({
    from: 'fm883254@gmail.com',
    to: email,
    subject: 'Admin Dashboard Password',
    text: `Your admin password is: ${newPassword}`,
  });
}

// createAdminPassword();



app.post('/adminLogin', async (req, res) => {
  try {
    const {password} = req.body;
    if (!password) {
      return res.status(404).json({ message: "user password can't be empty" });
    }
    const visitor = await Visitor.findOne();

    if (!visitor || !visitor.admin || !visitor.admin.password) {
      return res.status(404).json({ message: 'Admin credentials not set' });
    }
    const isMatch = await bcrypt.compare(password, visitor.admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Admin login successful', isAdmin: true });

  } catch (err) {
    console.error('Error getting visitor count:', err);
    res.status(500).json({ error: 'Failed to retrieve visitor count' });
  }
})

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
