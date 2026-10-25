import express from 'express';
import apiRouter from '../src/server/api.ts';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'MessMate 2.0 (Vercel Serverless)', timestamp: new Date() });
});

export default app;
