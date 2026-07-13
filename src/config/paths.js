const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const uploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(projectRoot, 'uploads');

module.exports = { projectRoot, uploadsDir };
