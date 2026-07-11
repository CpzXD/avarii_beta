const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { uploadsDir } = require('./config/paths');
const { reverseGeocode } = require('./services/geocoding.service');

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/geocoding/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ eroare: 'Coordonate invalide.' });
  }
  const adresa = await reverseGeocode(lat, lng);
  res.json({ adresa });
});

app.use('/auth', require('./routes/auth.routes'));
app.use('/avarii', require('./routes/avarii.routes'));

app.listen(PORT, () => {
  console.log(`Server pornit pe portul ${PORT}`);
});
