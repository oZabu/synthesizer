import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3240;

// Serve static files from the 'dist' directory (one level up from src)
app.use(express.static(path.join(__dirname, '../dist')));

// Handle SPA routing: return index.html for all requests that don't match static files
app.use((req, res) => {
  // For all unmatched requests, serve index.html
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

console.log('Starting server...');
console.log('Current directory:', __dirname);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});
