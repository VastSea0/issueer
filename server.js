import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting server...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Setting up middleware...');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

console.log('Setting up routes...');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Analyzing message:', message);
    // For now, return a mock response
    res.json({
      shouldCreateIssue: true,
      type: 'bug',
      title: 'Test issue',
      description: 'Test description',
      labels: ['bug']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/improve', async (req, res) => {
  try {
    const { issueData } = req.body;
    console.log('Improving issue:', issueData);
    res.json(null); // Mock response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-issue', async (req, res) => {
  try {
    const { owner, repo, title, body, labels } = req.body;
    console.log('Creating issue:', { owner, repo, title });
    res.json({
      success: false,
      error: 'GitHub token not configured. Please set GITHUB_TOKEN in .env file.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log(`Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🚀 Web UI server running at http://localhost:${PORT}`);
});
