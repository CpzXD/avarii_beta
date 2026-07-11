const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(projectRoot, 'data');
const uploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(projectRoot, 'uploads');
const bundledDataDir = path.join(projectRoot, 'data');
const bundledUploadsDir = path.join(projectRoot, 'uploads');

module.exports = {
  projectRoot,
  dataDir,
  uploadsDir,
  bundledDataDir,
  bundledUploadsDir,
};
