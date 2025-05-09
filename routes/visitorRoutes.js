const express = require('express');
const axios = require('axios');
const requestIp = require('request-ip');
const UAParser = require('ua-parser-js');
const Visitor = require('../models/Visitor');
const router = express.Router();

router.post('/track-visitor', async (req, res) => {
  const ip = requestIp.getClientIp(req);
  const userAgent = req.get('User-Agent');
  const urlVisited = req.body.url || 'Unknown';
  const parser = new UAParser(userAgent);
  const os = parser.getOS().name;
  const browser = parser.getBrowser().name;
  const device = parser.getDevice().type || 'Desktop';

  try {
    const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
    const { city, country_name: country } = geoRes.data;

    const newVisit = {
      ip,
      userAgent,
      os,
      browser,
      device,
      city,
      country,
      urlVisited,
      visitedAt: new Date()
    };

    // Find or create the main document
    let visitorDoc = await Visitor.findOne();
    if (!visitorDoc) {
      visitorDoc = new Visitor({ visits: [] });
    }

    // Avoid duplicates: same IP + UserAgent + URL
    const isDuplicate = visitorDoc.visits.some(visit =>
      visit.ip === ip &&
      visit.userAgent === userAgent &&
      visit.urlVisited === urlVisited
    );

    if (!isDuplicate) {
      visitorDoc.visits.push(newVisit);
      await visitorDoc.save();
      res.status(200).json({ message: 'Visit tracked successfully' });
    } else {
      res.status(200).json({ message: 'Duplicate visit, not added' });
    }
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

router.get('/get_visitors',async(req,res)=>{
  const visitorDoc = await Visitor.find();
  res.json({data:visitorDoc});
});

module.exports = router;
