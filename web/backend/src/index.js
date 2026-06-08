import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import queueRouter from './routes/queue.js';
import contentRouter from './routes/content.js';
import errorsRouter from './routes/errors.js';
import logsRouter from './routes/logs.js';
import workflowsRouter from './routes/workflows.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/queue', queueRouter);
app.use('/api/content', contentRouter);
app.use('/api/errors', errorsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/workflows', workflowsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'خطأ في الخادم' });
});

app.listen(config.port, () => {
  console.log(`YouTube Automation API → http://localhost:${config.port}`);
  console.log(`Health check → http://localhost:${config.port}/api/health`);
});
