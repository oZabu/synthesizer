import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3240;

// Resolve path to 'dist' folder (one level up from 'src')
const distPath = path.resolve(__dirname, '../dist');

// Serve static files from the 'dist' directory
app.use(express.static(distPath));

// Handle SPA routing: return index.html for all requests
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});
