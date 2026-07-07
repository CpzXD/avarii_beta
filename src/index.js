const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', require('./routes/auth.routes'));
app.use('/avarii', require('./routes/avarii.routes'));

app.listen(PORT, () => {
  console.log(`Server pornit pe portul ${PORT}`);
});
