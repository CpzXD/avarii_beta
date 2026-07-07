const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const extensie = path.extname(file.originalname);
    const numeUnic = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensie}`;
    cb(null, numeUnic);
  },
});

const filtruFisiere = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Doar fisiere imagine sunt acceptate.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filtruFisiere,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
