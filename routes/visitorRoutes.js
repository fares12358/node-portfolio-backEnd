const express = require('express');
const axios = require('axios');
const requestIp = require('request-ip');
const UAParser = require('ua-parser-js');
const Visitor = require('../models/Visitor');
const transporter = require('../utils/nodemailer');
const router = express.Router();
const dotenv = require('dotenv');
const { protect } = require('../middleware/adminToken');
dotenv.config();

router.post('/track-visitor', async (req, res) => {
  const { url, role, heardFrom, counter } = req.body;
  const ip = requestIp.getClientIp(req);
  const userAgent = req.get('User-Agent');
  const urlVisited = url || 'Unknown';

  const parser = new UAParser(userAgent);
  const os = parser.getOS().name;
  const browser = parser.getBrowser().name;
  const device = parser.getDevice().type || 'Desktop';

  try {
    // Get geo info
    const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
    const { city, country_name: country } = geoRes.data;

    // Find or create the main Visitor document
    let visitorDoc = await Visitor.findOne();
    if (!visitorDoc) {
      visitorDoc = new Visitor({ visits: [], counter: 0 });
    }

    // Check if visitor already exists
    const existingVisitIndex = visitorDoc.visits.findIndex(visit =>
      visit.ip === ip &&
      visit.userAgent === userAgent &&
      visit.urlVisited === urlVisited
    );

    if (existingVisitIndex === -1) {
      // New visitor
      const newVisit = {
        ip,
        userAgent,
        os,
        browser,
        device,
        city,
        country,
        urlVisited,
        role,
        heardFrom,
        counter: 1,
        visitedAt: new Date(),
      };

      visitorDoc.visits.push(newVisit);
      visitorDoc.counter = (visitorDoc.counter || 0) + 1;

      // Sort visits by visitedAt descending
      visitorDoc.visits.sort((a, b) => b.visitedAt - a.visitedAt);

      await visitorDoc.save();

      await transporter.sendMail({
        from: 'fm883254@gmail.com',
        to: 'fm883254@gmail.com',
        subject: 'New visitor on your website',
        text: `New visitor info:
        IP: ${ip}
        OS: ${os}
        Browser: ${browser}
        City: ${city}
        Country: ${country}
        URL: ${urlVisited}
        role: ${role}
        heardFrom:${heardFrom}
        `

      });

      return res.status(200).json({ message: 'New visit tracked successfully' });

    } else {
      // Existing visitor
      const existingVisit = visitorDoc.visits[existingVisitIndex];

      if (counter === 'pluse') {
        existingVisit.counter = (existingVisit.counter || 1) + 1;
      }

      visitorDoc.counter = (visitorDoc.counter || 0) + 1;

      // Sort visits by visitedAt descending
      visitorDoc.visits.sort((a, b) => b.visitedAt - a.visitedAt);

      await visitorDoc.save();

      await transporter.sendMail({
        from: 'fm883254@gmail.com',
        to: 'fm883254@gmail.com',
        subject: 'Visitor revisited your website',
        text: `Repeat visitor info:
        IP: ${ip}
        OS: ${os}
        Browser: ${browser}
        City: ${city}
        Country: ${country}
        URL: ${urlVisited}
        role: ${role}
        heardFrom:${heardFrom}
        `
      });

      return res.status(200).json({ message: 'Repeat visit counted' });
    }
  } catch (err) {
    console.error('Tracking error:', err);
    return res.status(500).json({ error: 'Failed to track visit' });
  }
});


router.get('/get_visitors', async (req, res) => {
  try {
    // 1. Grab all Visitor docs
    const visitorDocs = await Visitor.find().exec();
    // 2. For each doc, sort its visits array by visitedAt
    visitorDocs.forEach(doc => {
      doc.visits.sort((a, b) => {
        // For oldest → newest use: a.visitedAt - b.visitedAt
        // For newest → oldest use:  b.visitedAt - a.visitedAt
        return b.visitedAt - a.visitedAt;
      });
    });
    const documents = await Visitor.find().select('visits.country visits.heardFrom visits.role');
    const countryCountMap = new Map();
    const heardFromCountMap = new Map();
    const roleCountMap = new Map();

    documents.forEach(doc => {
      doc.visits.forEach(visit => {
        // Count countries
        const country = visit.country;
        if (country) {
          countryCountMap.set(country, (countryCountMap.get(country) || 0) + 1);
        }

        // Count heardFrom
        const source = visit.heardFrom;
        if (source) {
          heardFromCountMap.set(source, (heardFromCountMap.get(source) || 0) + 1);
        }

        // Count roles
        const role = visit.role;
        if (role) {
          roleCountMap.set(role, (roleCountMap.get(role) || 0) + 1);
        }
      });
    });

    const countries = Array.from(countryCountMap.entries()).map(
      ([country, count]) => ({ country, count })
    );

    const heardFrom = Array.from(heardFromCountMap.entries()).map(
      ([source, count]) => ({ source, count })
    );

    const roles = Array.from(roleCountMap.entries()).map(
      ([role, count]) => ({ role, count })
    );

    res.json({ data: visitorDocs, countries: countries, heardFrom: heardFrom, roles: roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch/sort visitors /countries' });
  }
});




module.exports = router;
