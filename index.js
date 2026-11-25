import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import requestRoutes from './routes/requests.js';
import workspaceRoutes from './routes/workspace.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/workspace', workspaceRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use(express.static(path.join(here, '..', 'public')));
app.get('/app', (_req, res) => res.sendFile(path.join(here, '..', 'public', 'app.html')));
app.get('*', (_req, res) => res.sendFile(path.join(here, '..', 'public', 'app.html')));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT || 3000);
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is unset. Auth is disabled until you configure .env.');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentra')
  .then(() => app.listen(port, () => console.log(`MENTRA is running at http://localhost:${port}`)))
  .catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
