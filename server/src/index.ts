// 📁 server/src/index.ts - Entry point for the backend server
// 🎯 Core function: Initializes Express server and connects middleware
// 🔗 Key dependencies: express, cors, dotenv
// 💡 Usage: Main entry point for the backend

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import characterRoutes from './routes/characterRoutes';
import adminRoutes from './routes/adminRoutes';
import staticRoutes from './routes/staticRoutes';
import { TimeService } from './utils/timeService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// * Initialize Time Service
TimeService.init().then(() => {
  console.log('Server time system ready');
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/static', staticRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

