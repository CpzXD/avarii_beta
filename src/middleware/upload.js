const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { uploadsDir } = require('../config/paths');

const allowed = {
  jpeg: { extension: '.jpg', mime: 'image/jpeg' },
  png: { extension: '.png', mime: 'image/png' },
  webp: { extension: '.webp', mime: 'image/webp' },
};

function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return allowed.jpeg;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return allowed.png;
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return allowed.webp;
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(new Error('Sunt acceptate doar imagini JPG, PNG sau WebP.'));
    cb(null, true);
  },
});

function saveImage(file) {
  if (!file) return null;
  const type = detectImage(file.buffer);
  if (!type) throw new Error('Fișierul încărcat nu este o imagine validă.');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${type.extension}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer, { flag: 'wx' });
  return `/uploads/${filename}`;
}

module.exports = { upload, saveImage };
